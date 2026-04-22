package tn.esprit.projet_module.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.projet_module.entity.ProjectSkill;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.projet_module.entity.ProjectSkill;

public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {

        List<ProjectSkill> findByProjectId(Long projectId);
        void deleteByProjectId(Long projectId);
    @Query("SELECT ps.skillName, COUNT(ps), ps.demand " +
            "FROM ProjectSkill ps GROUP BY ps.skillName, ps.demand " +
            "ORDER BY COUNT(ps) DESC")
    List<Object[]> findTopSkills();

    @Query("SELECT ps.skillName, COUNT(ps), ps.demand " +
            "FROM ProjectSkill ps WHERE ps.project.clientId = :clientId " +
            "GROUP BY ps.skillName, ps.demand " +
            "ORDER BY COUNT(ps) DESC")
    List<Object[]> findTopSkillsByClient(@Param("clientId") Long clientId);
    }

