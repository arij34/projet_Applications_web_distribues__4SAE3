package tn.freelancy.skillmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.freelancy.skillmanagement.entity.FreelancerSkill;

import java.util.List;
import java.util.Set;

@Repository
public interface FreelancerSkillRepository extends JpaRepository<FreelancerSkill, Long> {

    // ✅ OK — pas de référence User
    List<FreelancerSkill> findByCustomSkillName(String suggestedName);

    // ✅ SUPPRIMÉ : void deleteByUser(User user) — User n'existe plus

    // ✅ CORRIGÉ : JPQL utilisait fs.user.id → remplacé par fs.userId (colonne directe)
    @Query("SELECT fs FROM FreelancerSkill fs WHERE fs.userId = :userId")
    List<FreelancerSkill> findByUserId(@Param("userId") Long userId);

    // ✅ CORRIGÉ : JPQL utilisait fs.user.id → remplacé par fs.userId
    @Query("SELECT fs.skill.idS FROM FreelancerSkill fs WHERE fs.userId = :userId AND fs.skill IS NOT NULL")
    Set<Long> findSkillIdsByUserId(@Param("userId") Long userId);

    // ✅ CORRIGÉ : JPQL utilisait fs.user.id → remplacé par fs.userId
    @Query("SELECT fs.skill.idS, COUNT(fs) FROM FreelancerSkill fs WHERE fs.userId = :freelancerId AND fs.skill IS NOT NULL GROUP BY fs.skill.idS HAVING COUNT(fs) > 1")
    List<Object[]> findDuplicateSkillIds(@Param("freelancerId") Long freelancerId);

    // ✅ CORRIGÉ : findByUser_IdAndSkill_IdSIn → findByUserIdAndSkillIdSIn
    //              Spring Data dérive la requête depuis le champ userId (Long) et skill.idS
    List<FreelancerSkill> findByUserIdAndSkillIdSIn(Long userId, List<Long> skillIdS);

    // ✅ OK — ces deux méthodes utilisaient déjà userId comme Long (Spring Data les dérive correctement)
    boolean existsByUserIdAndSkillIdS(Long userId, Long skillId);

    boolean existsByUserIdAndCustomSkillNameIgnoreCase(Long userId, String customSkillName);
    // ✅ AJOUT : compter combien d'autres freelancers utilisent ce customSkillName (hors id donné)
    long countByCustomSkillNameIgnoreCaseAndIdNot(String customSkillName, Long id);
}