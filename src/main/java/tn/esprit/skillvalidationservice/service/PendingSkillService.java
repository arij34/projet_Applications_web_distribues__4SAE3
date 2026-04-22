package tn.esprit.skillvalidationservice.service;

import org.springframework.stereotype.Service;
import tn.esprit.skillvalidationservice.entity.PendingSkill;
import tn.esprit.skillvalidationservice.entity.Source;
import tn.esprit.skillvalidationservice.entity.Status;
import tn.esprit.skillvalidationservice.repository.PendingSkillRepository;

import java.util.List;

@Service
public class PendingSkillService {

    private final PendingSkillRepository repository;

    public PendingSkillService(PendingSkillRepository repository) {
        this.repository = repository;
    }

    // ── SAVE depuis RabbitMQ ──────────────────────────────
    public void saveFromMessage(String name, String normalized, Long userId) {
        PendingSkill skill = PendingSkill.builder()
                .suggestedName(name)
                .normalizedName(normalized)
                .suggestedBy(userId)
                .source(Source.FREELANCER)
                .status(Status.PENDING)
                .build();
        repository.save(skill);
    }

    // ── GET ALL ───────────────────────────────────────────
    public List<PendingSkill> getAll() {
        return repository.findAll();
    }

    // ── APPROVE ───────────────────────────────────────────
    public void approve(Long id) {
        PendingSkill skill = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
        skill.setStatus(Status.APPROVED);
        repository.save(skill);
    }

    // ── REJECT ────────────────────────────────────────────
    public void reject(Long id) {
        repository.deleteById(id);
    }
}