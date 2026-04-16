package tn.freelancy.skillmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.freelancy.skillmanagement.entity.Skill;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Skill findByNormalizedNameIgnoreCase(String normalizedName);
    List<Skill> findByNameContainingIgnoreCase(String name);
    @Query("SELECT s FROM Skill s WHERE LOWER(s.normalizedName) LIKE LOWER(CONCAT('%', :input, '%'))")
    List<Skill> findSimilarSkills(@Param("input") String input);

    boolean existsByNormalizedName(String normalizedName);
}