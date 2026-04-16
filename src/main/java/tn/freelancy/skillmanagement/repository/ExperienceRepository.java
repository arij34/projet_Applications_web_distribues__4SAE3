package tn.freelancy.skillmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.freelancy.skillmanagement.entity.Experience;

import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    // ✅ CORRIGÉ : findByUser_Id → findByUserId
    //              car userId est maintenant une colonne Long simple (plus de relation @ManyToOne User)
    List<Experience> findByUserId(Long userId);

    // ✅ SUPPRIMÉ : void deleteByUser(User user) — User n'existe plus dans ce projet
}