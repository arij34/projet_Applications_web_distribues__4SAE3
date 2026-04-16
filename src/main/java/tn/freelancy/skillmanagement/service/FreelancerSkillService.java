package tn.freelancy.skillmanagement.service;

import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.dto.DuplicateSkillDTO;
import tn.freelancy.skillmanagement.dto.SkillCheckResponse;
import tn.freelancy.skillmanagement.dto.SkillMatchResult;
import tn.freelancy.skillmanagement.entity.*;
import tn.freelancy.skillmanagement.repository.FreelancerSkillRepository;
import tn.freelancy.skillmanagement.repository.PendingSkillRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class FreelancerSkillService {

    private final FreelancerSkillRepository freelancerSkillRepository;
    private final PendingSkillRepository pendingSkillRepository;
    private final SkillMatcherService skillMatcherService;
    private final PendingSkillService pendingSkillService;
    private final SimilarityService similarityService;

    public FreelancerSkillService(FreelancerSkillRepository freelancerSkillRepository,
                                  PendingSkillRepository pendingSkillRepository,
                                  SkillMatcherService skillMatcherService,
                                  PendingSkillService pendingSkillService,
                                  SimilarityService similarityService) {
        this.freelancerSkillRepository = freelancerSkillRepository;
        this.pendingSkillRepository = pendingSkillRepository;
        this.skillMatcherService = skillMatcherService;
        this.pendingSkillService = pendingSkillService;
        this.similarityService = similarityService;
    }

    // ── GET ───────────────────────────────────────────────────────────────────

    public List<FreelancerSkill> getAllFreelancerSkills() {
        return freelancerSkillRepository.findAll();
    }

    public FreelancerSkill getFreelancerSkillById(Long id) {
        return freelancerSkillRepository.findById(id).orElse(null);
    }

    public List<FreelancerSkill> getFreelancerSkillsByUserId(Long userId) {
        return freelancerSkillRepository.findByUserId(userId);
    }

    // ── DELETE avec synchronisation PendingSkill ──────────────────────────────
    public void deleteFreelancerSkill(Long id) {
        FreelancerSkill fs = freelancerSkillRepository.findById(id).orElse(null);

        if (fs != null && fs.getSkill() == null && fs.getCustomSkillName() != null) {
            String normalized = fs.getCustomSkillName().toLowerCase().trim();

            long count = freelancerSkillRepository
                    .countByCustomSkillNameIgnoreCaseAndIdNot(fs.getCustomSkillName(), id);

            if (count == 0) {
                pendingSkillRepository
                        .findByNormalizedNameAndStatus(normalized, Status.DRAFT)
                        .ifPresent(pendingSkillRepository::delete);
            }
        }

        freelancerSkillRepository.deleteById(id);
    }

    // ── LEVEL ─────────────────────────────────────────────────────────────────
    public Level calculateLevel(int yearsExperience) {
        if (yearsExperience == 0)      return Level.BEGINNER;
        else if (yearsExperience <= 2) return Level.ELEMENTARY;
        else if (yearsExperience <= 4) return Level.INTERMEDIATE;
        else if (yearsExperience <= 7) return Level.ADVANCED;
        else                           return Level.EXPERT;
    }

    // ── CREATE (manuel) ───────────────────────────────────────────────────────
    /**
     * ✅ Contrôle total anti-doublon
     * - Refuse la création si le user a déjà ce skill (par id) OU le même customSkillName (insensible à la casse)
     */
    public FreelancerSkill createFreelancerSkill(Long userId,
                                                 FreelancerSkill freelancerSkill,
                                                 String skillInput) {

        freelancerSkill.setUserId(userId);
        freelancerSkill.setLevel(calculateLevel(freelancerSkill.getYearsExperience()));

        skillInput = skillInput.trim();

        SkillMatchResult result = skillMatcherService.findMatchOrSuggest(skillInput);

        // ---- NOUVELLE LOGIQUE ANTI-DOUBLON ----
        boolean existsCustom = freelancerSkillRepository.existsByUserIdAndCustomSkillNameIgnoreCase(userId, skillInput);

        if (result != null && result.getSkillName() != null) {
            Long skillId = result.getSkillName().getIdS();

            boolean existsSkill = freelancerSkillRepository
                    .existsByUserIdAndSkillIdS(userId, skillId);

            if (existsSkill || existsCustom) {
                throw new RuntimeException("Skill already exists for this user");
            }

            // On relie toujours à la skill référente même pour suggestion
            freelancerSkill.setSkill(result.getSkillName());
            freelancerSkill.setCustomSkillName(skillInput); // texte tapé par user
            // Pas de pendingSkill ici

        } else {
            // Aucun match en base : insertion skill=null + customSkillName + pending skill
            if (existsCustom) {
                throw new RuntimeException("Skill already exists for this user");
            }
            freelancerSkill.setSkill(null);
            freelancerSkill.setCustomSkillName(skillInput);

            pendingSkillService.createPendingSkill(
                    skillInput, userId, "User #" + userId, Source.FREELANCER
            );
        }

        return freelancerSkillRepository.save(freelancerSkill);
    }

    // ── CREATE (depuis CV) ────────────────────────────────────────────────────
    public FreelancerSkill createFreelancerSkillCv(Long userId,
                                                   FreelancerSkill freelancerSkill,
                                                   String skillInput) {

        freelancerSkill.setUserId(userId);
        freelancerSkill.setLevel(calculateLevel(freelancerSkill.getYearsExperience()));
        skillInput = skillInput.trim();

        SkillMatchResult result = skillMatcherService.findMatchOrSuggest(skillInput);

        boolean existsCustom = freelancerSkillRepository.existsByUserIdAndCustomSkillNameIgnoreCase(userId, skillInput);

        if (result != null && result.getSkillName() != null) {
            Long skillId = result.getSkillName().getIdS();
            boolean existsSkill = freelancerSkillRepository
                    .existsByUserIdAndSkillIdS(userId, skillId);

            if (existsSkill || existsCustom) {
                throw new RuntimeException("Skill already exists for this user");
            }
            // Dans tous les cas, on référence la skill trouvée; le customSkillName garde le texte original
            freelancerSkill.setSkill(result.getSkillName());
            freelancerSkill.setCustomSkillName(skillInput);
        } else {
            if (existsCustom) {
                throw new RuntimeException("Skill already exists for this user");
            }
            freelancerSkill.setSkill(null);
            freelancerSkill.setCustomSkillName(skillInput);

            pendingSkillService.createPendingSkill(
                    skillInput, userId, "User #" + userId, Source.CV
            );
        }

        return freelancerSkillRepository.save(freelancerSkill);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    public FreelancerSkill updateFreelancerSkill(FreelancerSkill freelancerSkill) {
        freelancerSkill.setLevel(calculateLevel(freelancerSkill.getYearsExperience()));
        return freelancerSkillRepository.save(freelancerSkill);
    }

    // ── DUPLICATE DETECTION ───────────────────────────────────────────────────
    public List<DuplicateSkillDTO> detectDuplicates(Long freelancerId) {

        List<FreelancerSkill> skills = freelancerSkillRepository.findByUserId(freelancerId);
        List<DuplicateSkillDTO> duplicates = new ArrayList<>();

        for (int i = 0; i < skills.size(); i++) {
            for (int j = i + 1; j < skills.size(); j++) {

                String nameA = skills.get(i).getCustomSkillName();
                String nameB = skills.get(j).getCustomSkillName();

                if (nameA == null || nameB == null) continue;

                SkillMatchResult matchA = skillMatcherService.findMatchOrSuggest(nameA);
                SkillMatchResult matchB = skillMatcherService.findMatchOrSuggest(nameB);

                if (matchA != null && matchB != null) {

                    // ✅ Même skill réel
                    if (matchA.getSkillName() != null &&
                            matchB.getSkillName() != null &&
                            matchA.getSkillName().getIdS().equals(matchB.getSkillName().getIdS())) {

                        duplicates.add(new DuplicateSkillDTO(nameA, nameB, 1.0));
                    }

                    // ✅ Similarité forte custom
                    else {
                        double sim = similarityService.calculateSimilarity(
                                nameA.toLowerCase(), nameB.toLowerCase());

                        if (sim > 0.8) {
                            duplicates.add(new DuplicateSkillDTO(nameA, nameB, sim));
                        }
                    }
                }
            }
        }

        return duplicates;
    }

    // ── CHECK EXISTING ────────────────────────────────────────────────────────
    public SkillCheckResponse checkExistingSkills(Long userId, List<String> skills) {

        List<String> existing = new ArrayList<>();
        List<String> newSkills = new ArrayList<>();

        for (String skillInput : skills) {

            skillInput = skillInput.trim();

            SkillMatchResult result = skillMatcherService.findMatchOrSuggest(skillInput);

            boolean existsSkill = false;
            boolean existsCustom = freelancerSkillRepository
                    .existsByUserIdAndCustomSkillNameIgnoreCase(userId, skillInput);

            if (result != null && result.getSkillName() != null) {
                existsSkill = freelancerSkillRepository
                        .existsByUserIdAndSkillIdS(userId, result.getSkillName().getIdS());
            }

            if (existsSkill || existsCustom) {
                existing.add(skillInput);
            } else {
                newSkills.add(skillInput);
            }
        }

        return new SkillCheckResponse(existing, newSkills);
    }
}