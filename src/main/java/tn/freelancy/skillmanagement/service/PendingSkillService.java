package tn.freelancy.skillmanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.entity.*;
import tn.freelancy.skillmanagement.repository.*;

import java.util.Date;
import java.util.List;

@Service
public class PendingSkillService {

    @Autowired
    private PendingSkillRepository pendingSkillRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private FreelancerSkillRepository freelancerSkillRepository;

    @Autowired
    private NotificationService notificationService;

    // ── GET ALL DRAFTS ────────────────────────────────────────────────────────

    public List<PendingSkill> getAllDrafts() {
        return pendingSkillRepository.findByStatus(Status.DRAFT);
    }

    // ── APPROVE ───────────────────────────────────────────────────────────────

    public void approvePendingSkill(Long pendingId) {
        PendingSkill pending = pendingSkillRepository.findById(pendingId).orElseThrow();

        Skill existing = skillRepository.findByNormalizedNameIgnoreCase(pending.getNormalizedName());

        if (existing == null) {
            Skill newSkill = new Skill();
            newSkill.setName(pending.getSuggestedName());
            newSkill.setNormalizedName(pending.getNormalizedName());
            newSkill.setCreatedAt(new Date());
            existing = skillRepository.save(newSkill);
        }

        pending.setStatus(Status.APPROVED);
        pendingSkillRepository.save(pending);

        List<FreelancerSkill> freelancerSkills =
                freelancerSkillRepository.findByCustomSkillName(pending.getSuggestedName());

        for (FreelancerSkill fs : freelancerSkills) {
            fs.setSkill(existing);
            freelancerSkillRepository.save(fs);
        }

        if (pending.getSuggestedBy() != null) {
            notificationService.notifyFreelancerSkillApproved(
                    pending.getSuggestedName(),
                    pending.getSuggestedBy(),
                    "User #" + pending.getSuggestedBy()
            );
        }

        pendingSkillRepository.delete(pending);
    }

    // ── REJECT ────────────────────────────────────────────────────────────────

    public void reject(Long id) {
        PendingSkill pending = pendingSkillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));

        pending.setStatus(Status.REJECTED);
        pendingSkillRepository.save(pending);

        if (pending.getSuggestedBy() != null) {
            notificationService.notifyFreelancerSkillRejected(
                    pending.getSuggestedName(),
                    pending.getSuggestedBy(),
                    "User #" + pending.getSuggestedBy()
            );
        }
    }

    // ── CREATE PENDING SKILL ──────────────────────────────────────────────────

    /**
     * ✅ CORRIGÉ : signature changée — plus besoin de l'objet User
     *              on reçoit directement userId (Long) et freelancerName (String)
     *              fournis par le service appelant depuis le token JWT via Feign
     */
    public void createPendingSkill(String skillInput,
                                   Long userId,
                                   String freelancerName,
                                   Source source) {

        String normalized = skillInput.toLowerCase().trim();

        boolean exists = pendingSkillRepository
                .existsByNormalizedNameAndStatus(normalized, Status.DRAFT);

        if (!exists) {
            PendingSkill pending = new PendingSkill();
            pending.setSuggestedName(skillInput);
            pending.setNormalizedName(normalized);
            pending.setSuggestedBy(userId);          // ✅ userId directement
            pending.setSource(Source.FREELANCER);
            pending.setStatus(Status.DRAFT);

            pendingSkillRepository.save(pending);

            // ✅ CORRIGÉ : plus de user.getNom() — on utilise freelancerName passé en paramètre
            notificationService.notifyAdminNewPendingSkill(
                    skillInput,
                    userId,
                    freelancerName
            );
        }
    }
}