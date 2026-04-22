package tn.esprit.projet_module.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projet_module.entity.Project;
import tn.esprit.projet_module.entity.ProjectStatus;
import tn.esprit.projet_module.repository.ProjectRepository;
import tn.esprit.projet_module.repository.ProjectSkillRepository;
import tn.esprit.projet_module.repository.SavedProjectRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/stats")
public class StatsController {

    private final ProjectRepository projectRepo;
    private final ProjectSkillRepository skillRepo;
    private final SavedProjectRepository savedRepo;

    public StatsController(ProjectRepository projectRepo,
                           ProjectSkillRepository skillRepo,
                           SavedProjectRepository savedRepo) {
        this.projectRepo = projectRepo;
        this.skillRepo   = skillRepo;
        this.savedRepo   = savedRepo;
    }

    // ── Helper : filtre les projets selon clientId ──
    private List<Project> getProjects(Long clientId) {
        List<Project> all = projectRepo.findAll();
        if (clientId != null) {
            return all.stream()
                    .filter(p -> clientId.equals(p.getClientId()))
                    .collect(Collectors.toList());
        }
        return all;
    }

    // ── KPIs ──
    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKpis(
            @RequestParam(required = false) Long clientId) {

        List<Project> projects = getProjects(clientId);

        long open       = projects.stream().filter(p -> ProjectStatus.OPEN.equals(p.getStatus())).count();
        long completed  = projects.stream().filter(p -> ProjectStatus.COMPLETED.equals(p.getStatus())).count();
        long inProgress = projects.stream().filter(p -> ProjectStatus.IN_PROGRESS.equals(p.getStatus())).count();
        long draft      = projects.stream().filter(p -> ProjectStatus.DRAFT.equals(p.getStatus())).count();
        long saved      = clientId == null ? savedRepo.count() : 0;

        double estimatedBudget = projects.size() * 15000.0;

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalProjects",      projects.size());
        kpis.put("openProjects",       open);
        kpis.put("completedProjects",  completed);
        kpis.put("inProgressProjects", inProgress);
        kpis.put("draftProjects",      draft);
        kpis.put("totalSavedCount",    saved);
        kpis.put("totalBudget",        estimatedBudget);
        kpis.put("platformRevenue",    estimatedBudget * 0.10);
        kpis.put("isClientView",       clientId != null);
        return ResponseEntity.ok(kpis);
    }

    // ── Top Skills ──
    @GetMapping("/top-skills")
    public ResponseEntity<List<Map<String, Object>>> getTopSkills(
            @RequestParam(required = false) Long clientId) {

        try {
            List<Object[]> raw;
            if (clientId != null) {
                raw = skillRepo.findTopSkillsByClient(clientId);
            } else {
                raw = skillRepo.findTopSkills();
            }
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : raw) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("skillName", row[0]);
                m.put("count",     row[1]);
                m.put("demand",    row.length > 2 ? row[2] : "Medium");
                result.add(m);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // ── Projets par semaine ──
    @GetMapping("/projects-per-week")
    public ResponseEntity<List<Map<String, Object>>> getProjectsPerWeek(
            @RequestParam(required = false) Long clientId) {

        List<Project> projects = getProjects(clientId);
        Map<String, Long> grouped = new LinkedHashMap<>();

        projects.stream()
                .filter(p -> p.getCreatedAt() != null)
                .sorted(Comparator.comparing(Project::getCreatedAt))
                .forEach(p -> {
                    java.time.LocalDate date = p.getCreatedAt().toLocalDate();
                    int week  = date.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());
                    int month = date.getMonthValue();
                    String key = "W" + week + " (M" + month + ")";
                    grouped.merge(key, 1L, Long::sum);
                });

        List<Map<String, Object>> result = new ArrayList<>();
        grouped.forEach((week, count) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("week",  week);
            m.put("count", count);
            result.add(m);
        });
        return ResponseEntity.ok(result);
    }

    // ── Most Saved ──
    @GetMapping("/most-saved")
    public ResponseEntity<List<Map<String, Object>>> getMostSaved(
            @RequestParam(required = false) Long clientId) {
        try {
            List<Object[]> raw;
            if (clientId != null) {
                raw = savedRepo.findMostSavedProjectsByClient(clientId);
            } else {
                raw = savedRepo.findMostSavedProjects();
            }
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : raw) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("projectId",    row[0]);
                m.put("projectTitle", row[1]);
                m.put("saveCount",    row[2]);
                result.add(m);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // ── Budget par complexité ──
    @GetMapping("/budget-by-complexity")
    public ResponseEntity<List<Map<String, Object>>> getBudgetByComplexity(
            @RequestParam(required = false) Long clientId) {

        List<Project> projects = getProjects(clientId);

        // Répartition simulée basée sur le nombre de projets réels
        int total = projects.size();
        List<Map<String, Object>> result = new ArrayList<>();

        String[] levels  = {"Simple", "Medium", "Complex", "Enterprise"};
        double[] budgets = {8000, 20000, 45000, 90000};
        double[] ratios  = {0.4, 0.35, 0.2, 0.05};

        for (int i = 0; i < levels.length; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("complexity", levels[i]);
            m.put("avgBudget",  budgets[i]);
            m.put("count",      (int)(total * ratios[i]));
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ── Freelancers total ──
    @GetMapping("/freelancers-total")
    public ResponseEntity<Map<String, Object>> getFreelancersTotal(
            @RequestParam(required = false) Long clientId) {

        List<Project> projects = getProjects(clientId);
        long open = projects.stream()
                .filter(p -> ProjectStatus.OPEN.equals(p.getStatus()))
                .count();

        Map<String, Object> res = new HashMap<>();
        res.put("total", open * 10);
        return ResponseEntity.ok(res);
    }
}