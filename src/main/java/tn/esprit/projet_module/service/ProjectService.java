package tn.esprit.projet_module.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tn.esprit.projet_module.entity.*;
import tn.esprit.projet_module.messaging.ProjectCreatedEvent;
import tn.esprit.projet_module.messaging.ProjectEventPublisher;
import tn.esprit.projet_module.repository.ProjectAnalysisRepository;
import tn.esprit.projet_module.repository.ProjectRepository;
import tn.esprit.projet_module.repository.ProjectHistoryRepository;
import tn.esprit.projet_module.repository.ProjectSkillRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectHistoryRepository historyRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectAnalysisRepository analysisRepository;
    private final ProjectEventPublisher projectEventPublisher;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectHistoryRepository historyRepository,
                          ProjectSkillRepository projectSkillRepository,
                          ProjectAnalysisRepository analysisRepository,
                          ProjectEventPublisher projectEventPublisher) {
        this.projectRepository      = projectRepository;
        this.historyRepository      = historyRepository;
        this.projectSkillRepository = projectSkillRepository;
        this.analysisRepository     = analysisRepository;
        this.projectEventPublisher  = projectEventPublisher;
    }

    // CREATE
    public Project createProject(Project project) {
        if (project.getStatus() == null) {
            project.setStatus(ProjectStatus.DRAFT);
        }
        Project saved = projectRepository.save(project);

        // Async communication (RabbitMQ): notify other services.
        projectEventPublisher.publishProjectCreated(new ProjectCreatedEvent(
                saved.getId(),
                saved.getTitle(),
                saved.getClientId(),
                saved.getKeycloakId(),
                Instant.now()
        ));

        return saved;
    }

    // READ by id
    public Project getProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet non trouvé"));
    }

    // READ by client
    public List<Project> getProjectsByClient(Long clientId) {
        return projectRepository.findByClientId(clientId);
    }

    // UPDATE
    public Project updateProject(Long id, Project newData) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setTitle(newData.getTitle());
        project.setDescription(newData.getDescription());
        project.setDeadline(newData.getDeadline());
        project.setStatus(newData.getStatus());
        project.setClientId(newData.getClientId());

        return projectRepository.save(project);
    }

    // ── Enregistrer une entrée dans l'historique admin ──
    private void saveAdminHistory(Project project, AdminAction action) {
        ProjectHistory history = new ProjectHistory();
        history.setProjectTitle(project.getTitle());
        history.setClientId(project.getClientId());
        history.setOldStatus(project.getStatus());
        history.setAdminAction(action);
        // project peut être null après suppression → on ne le lie pas
        historyRepository.save(history);
    }

    // ── Suppression complète dans le bon ordre ──
    private void deleteAllProjectData(Long id) {
        analysisRepository.findByProjectId(id)
                .ifPresent(analysisRepository::delete);
        projectSkillRepository.deleteByProjectId(id);
        historyRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
    }

    // DELETE direct (DRAFT uniquement)
    @Transactional
    public void deleteProject(Long id) {
        deleteAllProjectData(id);
    }

    // Changement de statut + historique
    public Project changeStatus(Long id, ProjectStatus newStatus) {
        Project project = getProject(id);

        ProjectHistory history = new ProjectHistory();
        history.setOldStatus(project.getStatus());
        history.setNewStatus(newStatus);
        history.setProject(project);
        historyRepository.save(history);

        project.setStatus(newStatus);
        return projectRepository.save(project);
    }

    // READ ALL
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public void requestDelete(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setDeleteRequested(true);
        projectRepository.save(project);
    }

    // Voir toutes les demandes en attente
    public List<Project> getDeleteRequests() {
        return projectRepository.findByDeleteRequestedTrue();
    }

    // ── Approuver → enregistrer historique AVANT suppression ──
    @Transactional
    public void approveDelete(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        saveAdminHistory(project, AdminAction.APPROVED);
        deleteAllProjectData(id);
    }

    // ── Refuser → enregistrer historique + remettre deleteRequested à false ──
    public void rejectDelete(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        saveAdminHistory(project, AdminAction.REJECTED);
        project.setDeleteRequested(false);
        projectRepository.save(project);
    }

    // ── Récupérer l'historique admin du dernier mois ──
    public List<ProjectHistory> getDeleteHistory() {
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        return historyRepository.findAdminActionsince(oneMonthAgo);
    }

    @Transactional
    public void saveProjectSkills(Project project, List<Map<String, Object>> skills) {
        projectSkillRepository.deleteByProjectId(project.getId());

        for (Map<String, Object> skillData : skills) {
            ProjectSkill skill = new ProjectSkill();
            skill.setProject(project);
            skill.setSkillName((String) skillData.get("name"));
            skill.setCategory((String) skillData.get("category"));
            skill.setDemand((String) skillData.get("demand"));

            if (skillData.get("hourly_rate") != null) {
                skill.setHourlyRate(((Number) skillData.get("hourly_rate")).intValue());
            }
            projectSkillRepository.save(skill);
        }
    }

    @SuppressWarnings("unchecked")
    public void saveProjectAnalysis(Project project, Map<String, Object> data) {
        ProjectAnalysis analysis = analysisRepository
                .findByProjectId(project.getId())
                .orElse(new ProjectAnalysis());
        analysis.setProject(project);

        Map<String, Object> budget = (Map<String, Object>) data.get("budget");
        analysis.setBudgetMin(toInt(budget.get("min")));
        analysis.setBudgetMax(toInt(budget.get("max")));
        analysis.setBudgetRecommended(toInt(budget.get("recommended")));
        analysis.setHourlyRateAvg(toInt(budget.get("hourly_rate_avg")));

        Map<String, Object> duration = (Map<String, Object>) data.get("duration");
        analysis.setDurationMinWeeks(toInt(duration.get("min_weeks")));
        analysis.setDurationMaxWeeks(toInt(duration.get("max_weeks")));
        analysis.setDurationEstimatedWeeks(toInt(duration.get("estimated_weeks")));
        analysis.setDurationWarning((String) duration.get("warning"));

        Map<String, Object> complexity = (Map<String, Object>) data.get("complexity");
        analysis.setComplexityLevel((String) complexity.get("level"));
        analysis.setComplexityScore(toInt(complexity.get("score")));

        Map<String, Object> risk = (Map<String, Object>) data.get("risk");
        analysis.setRiskLevel((String) risk.get("level"));
        analysis.setRiskScore(toInt(risk.get("score")));
        analysis.setRiskAdvice((String) risk.get("advice"));
        List<String> factors = (List<String>) risk.get("factors");
        if (factors != null) analysis.setRiskFactors(String.join(";", factors));

        Map<String, Object> profit = (Map<String, Object>) data.get("profit");
        analysis.setPlatformRevenue(toInt(profit.get("platform_revenue")));
        analysis.setFreelancerProfit(toInt(profit.get("freelancer_profit")));
        analysis.setNetProjectCost(toInt(profit.get("net_project_cost")));

        Map<String, Object> freelancers = (Map<String, Object>) data.get("freelancers");
        analysis.setFreelancersEstimatedCount(toInt(freelancers.get("estimated_count")));
        analysis.setFreelancersAvailability((String) freelancers.get("availability"));

        if (data.get("feasibilityScore") != null) {
            analysis.setFeasibilityScore(toInt(data.get("feasibilityScore")));
        }

        analysisRepository.save(analysis);
    }

    public ProjectAnalysis getAnalysisByProject(Long projectId) {
        return analysisRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        return ((Number) val).intValue();
    }
    public List<Project> getProjectsByClientEmail(String email) {
        return projectRepository.findByClientEmail(email);
    }
    public List<Project> getProjectsByKeycloakId(String keycloakId) {
        return projectRepository.findByKeycloakId(keycloakId);
    }
    public List<Project> getAcceptedProjectsByFreelancerKeycloakId(String keycloakId) {
        return projectRepository.findAcceptedProjectsByFreelancerKeycloakId(keycloakId);
    }

    public List<Project> getAcceptedProjectsByFreelancerId(Long freelancerId) {
        return projectRepository.findAcceptedProjectsByFreelancerId(freelancerId);
    }

}
