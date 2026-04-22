package tn.esprit.projet_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.projet_module.entity.AdminAction;
import tn.esprit.projet_module.entity.ProjectHistory;

import java.time.LocalDateTime;
import java.util.List;

public interface ProjectHistoryRepository extends JpaRepository<ProjectHistory, Long> {

    @Modifying
    @Query("DELETE FROM ProjectHistory h WHERE h.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);

    // Historique des actions admin (APPROVED/REJECTED) du dernier mois
    @Query("SELECT h FROM ProjectHistory h WHERE h.adminAction IS NOT NULL " +
            "AND h.changedAt >= :since ORDER BY h.changedAt DESC")
    List<ProjectHistory> findAdminActionsince(@Param("since") LocalDateTime since);
}