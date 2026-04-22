package tn.esprit.projet_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.projet_module.entity.Project;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByClientId(Long clientId);
    List<Project> findByDeleteRequestedTrue();
    List<Project> findByClientEmail(String email);

    @Query("SELECT YEAR(p.createdAt), WEEK(p.createdAt), COUNT(p) " +
            "FROM Project p GROUP BY YEAR(p.createdAt), WEEK(p.createdAt) " +
            "ORDER BY YEAR(p.createdAt), WEEK(p.createdAt)")
    List<Object[]> findProjectsPerWeek();

    List<Project> findByKeycloakId(String keycloakId);

    long countByStatus(String status);

    @Query("SELECT p FROM Project p JOIN Proposal pr ON pr.project = p " +
            "WHERE pr.freelancerKeycloakId = :keycloakId AND pr.status = 'ACCEPTED'")
    List<Project> findAcceptedProjectsByFreelancerKeycloakId(@Param("keycloakId") String keycloakId);

    @Query("SELECT p FROM Project p JOIN Proposal pr ON pr.project = p " +
            "WHERE pr.freelancerId = :freelancerId AND pr.status = 'ACCEPTED'")
    List<Project> findAcceptedProjectsByFreelancerId(@Param("freelancerId") Long freelancerId);
}