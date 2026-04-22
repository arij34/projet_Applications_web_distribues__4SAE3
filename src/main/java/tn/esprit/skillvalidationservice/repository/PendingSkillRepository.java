package tn.esprit.skillvalidationservice.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.skillvalidationservice.entity.PendingSkill;

public interface PendingSkillRepository extends JpaRepository<PendingSkill, Long> {
}
