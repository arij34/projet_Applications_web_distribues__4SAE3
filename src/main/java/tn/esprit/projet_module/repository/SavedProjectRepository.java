package tn.esprit.projet_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.projet_module.entity.SavedProject;
import java.util.List;
import java.util.Optional;

public interface SavedProjectRepository extends JpaRepository<SavedProject, Long> {

    // ── Par freelancerId ──
    List<SavedProject> findByFreelancerId(Long freelancerId);
    Optional<SavedProject> findByFreelancerIdAndProjectId(Long freelancerId, Long projectId);
    boolean existsByFreelancerIdAndProjectId(Long freelancerId, Long projectId);
    void deleteByFreelancerIdAndProjectId(Long freelancerId, Long projectId);

    // ── Par keycloakId ── ← AJOUTS
    List<SavedProject> findByFreelancerKeycloakId(String freelancerKeycloakId);
    boolean existsByFreelancerKeycloakIdAndProjectId(String freelancerKeycloakId, Long projectId);
    void deleteByFreelancerKeycloakIdAndProjectId(String freelancerKeycloakId, Long projectId);

    @Query("SELECT sp.project.id, sp.project.title, COUNT(sp) " +
            "FROM SavedProject sp GROUP BY sp.project.id, sp.project.title " +
            "ORDER BY COUNT(sp) DESC")
    List<Object[]> findMostSavedProjects();

    @Query("SELECT sp.project.id, sp.project.title, COUNT(sp) " +
            "FROM SavedProject sp WHERE sp.project.clientId = :clientId " +
            "GROUP BY sp.project.id, sp.project.title " +
            "ORDER BY COUNT(sp) DESC")
    List<Object[]> findMostSavedProjectsByClient(@Param("clientId") Long clientId);
}