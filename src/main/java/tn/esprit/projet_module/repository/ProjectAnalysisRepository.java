package tn.esprit.projet_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.projet_module.entity.ProjectAnalysis;

import java.util.List;
import java.util.Optional;

public interface ProjectAnalysisRepository extends JpaRepository<ProjectAnalysis, Long> {
    Optional<ProjectAnalysis> findByProjectId(Long projectId);
    void deleteByProjectId(Long projectId);
    @Query("SELECT SUM(pa.budgetRecommended) FROM ProjectAnalysis pa")
    List<Object[]> getBudgetStats();

    @Query("SELECT pa.complexityLevel, AVG(pa.budgetRecommended), COUNT(pa) " +
            "FROM ProjectAnalysis pa GROUP BY pa.complexityLevel")
    List<Object[]> getBudgetByComplexity();

    @Query("SELECT SUM(pa.freelancersEstimatedCount) FROM ProjectAnalysis pa")
    Long getTotalFreelancers();
}