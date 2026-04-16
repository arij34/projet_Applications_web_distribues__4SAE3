package tn.freelancy.skillmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.freelancy.skillmanagement.entity.Education;

import java.util.List;

@Repository
public interface EducationRepository extends JpaRepository<Education, Long> {

    // ✅ CORRIGÉ : findTopByUser_IdOrderByYearDesc → findTopByUserIdOrderByYearDesc
    //              car userId est maintenant une colonne Long simple (plus de relation @ManyToOne User)
    Education findTopByUserIdOrderByYearDesc(Long userId);

    // ✅ AJOUTÉ : toutes les formations d'un utilisateur (appelé par GET /user/me)
    List<Education> findByUserId(Long userId);

    // ✅ SUPPRIMÉ : void deleteByUser(User user) — User n'existe plus dans ce projet
}