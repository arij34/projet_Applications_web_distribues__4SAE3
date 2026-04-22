package tn.freelancy.skillmanagement.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.dto.DuplicateSkillDTO;
import tn.freelancy.skillmanagement.dto.PendingSkillMessage;
import tn.freelancy.skillmanagement.dto.SkillCheckResponse;
import tn.freelancy.skillmanagement.dto.SkillMatchResult;
import tn.freelancy.skillmanagement.entity.*;
import tn.freelancy.skillmanagement.repository.FreelancerSkillRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class FreelancerSkillService {

    private final FreelancerSkillRepository freelancerSkillRepository;
    private final SkillMatcherService skillMatcherService;
    private final SimilarityService similarityService;
    private final RabbitTemplate rabbitTemplate;

    public FreelancerSkillService(
            FreelancerSkillRepository freelancerSkillRepository,
            SkillMatcherService skillMatcherService,
            SimilarityService similarityService,
            RabbitTemplate rabbitTemplate
    ) {
        this.freelancerSkillRepository = freelancerSkillRepository;
        this.skillMatcherService = skillMatcherService;
        this.similarityService = similarityService;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ── CREATE ─────────────────────────────────────────────
    public FreelancerSkill createFreelancerSkill(Long userId,
                                                 FreelancerSkill freelancerSkill,
                                                 String skillInput) {

        freelancerSkill.setUserId(userId);
        freelancerSkill.setLevel(calculateLevel(freelancerSkill.getYearsExperience()));

        skillInput = skillInput.trim();

        SkillMatchResult result = skillMatcherService.findMatchOrSuggest(skillInput);

        boolean existsCustom = freelancerSkillRepository
                .existsByUserIdAndCustomSkillNameIgnoreCase(userId, skillInput);

        if (result != null && result.getSkillName() != null) {

            Long skillId = result.getSkillName().getIdS();

            boolean existsSkill = freelancerSkillRepository
                    .existsByUserIdAndSkillIdS(userId, skillId);

            if (existsSkill || existsCustom) {
                throw new RuntimeException("Skill already exists for this user");
            }

            freelancerSkill.setSkill(result.getSkillName());
            freelancerSkill.setCustomSkillName(skillInput);

        } else {

            if (existsCustom) {
                throw new RuntimeException("Skill already exists for this user");
            }

            freelancerSkill.setSkill(null);
            freelancerSkill.setCustomSkillName(skillInput);

            // 🔥 ENVOI RABBITMQ
            sendPendingSkillEvent(skillInput, userId, Source.FREELANCER);
        }

        return freelancerSkillRepository.save(freelancerSkill);
    }

    // ── RABBITMQ ─────────────────────────────────────────────
    private void sendPendingSkillEvent(String skillName, Long userId, Source source) {

        PendingSkillMessage message = new PendingSkillMessage(
                skillName,
                skillName.toLowerCase().trim(),
                userId,
                source,
                Status.PENDING
        );

        rabbitTemplate.convertAndSend(
                "skill.exchange",
                "skill.routing",
                message
        );
    }

    // ── LEVEL ─────────────────────────────────────────────
    public Level calculateLevel(int yearsExperience) {
        if (yearsExperience == 0) return Level.BEGINNER;
        else if (yearsExperience <= 2) return Level.ELEMENTARY;
        else if (yearsExperience <= 4) return Level.INTERMEDIATE;
        else if (yearsExperience <= 7) return Level.ADVANCED;
        else return Level.EXPERT;
    }

    // ── GET ─────────────────────────────────────────────
    public List<FreelancerSkill> getAllFreelancerSkills() {
        return freelancerSkillRepository.findAll();
    }

    public List<FreelancerSkill> getFreelancerSkillsByUserId(Long userId) {
        return freelancerSkillRepository.findByUserId(userId);
    }

    // ── DELETE ─────────────────────────────────────────────
    public void deleteFreelancerSkill(Long id) {
        freelancerSkillRepository.deleteById(id);
    }

    // ── UPDATE ─────────────────────────────────────────────
    public FreelancerSkill updateFreelancerSkill(FreelancerSkill freelancerSkill) {
        freelancerSkill.setLevel(calculateLevel(freelancerSkill.getYearsExperience()));
        return freelancerSkillRepository.save(freelancerSkill);
    }

    // ── DUPLICATES ─────────────────────────────────────────
    public List<DuplicateSkillDTO> detectDuplicates(Long freelancerId) {

        List<FreelancerSkill> skills = freelancerSkillRepository.findByUserId(freelancerId);
        List<DuplicateSkillDTO> duplicates = new ArrayList<>();

        for (int i = 0; i < skills.size(); i++) {
            for (int j = i + 1; j < skills.size(); j++) {

                String nameA = skills.get(i).getCustomSkillName();
                String nameB = skills.get(j).getCustomSkillName();

                if (nameA == null || nameB == null) continue;

                double sim = similarityService.calculateSimilarity(
                        nameA.toLowerCase(), nameB.toLowerCase());

                if (sim > 0.8) {
                    duplicates.add(new DuplicateSkillDTO(nameA, nameB, sim));
                }
            }
        }

        return duplicates;
    }

    // ── CHECK ─────────────────────────────────────────────
    public SkillCheckResponse checkExistingSkills(Long userId, List<String> skills) {

        List<String> existing = new ArrayList<>();
        List<String> newSkills = new ArrayList<>();

        for (String skillInput : skills) {

            skillInput = skillInput.trim();

            boolean exists = freelancerSkillRepository
                    .existsByUserIdAndCustomSkillNameIgnoreCase(userId, skillInput);

            if (exists) {
                existing.add(skillInput);
            } else {
                newSkills.add(skillInput);
            }
        }

        return new SkillCheckResponse(existing, newSkills);
    }
}