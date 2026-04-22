package tn.esprit.projet_module.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.esprit.projet_module.clients.ProjectAnalysisDTO;
import tn.esprit.projet_module.entity.Project;
import tn.esprit.projet_module.entity.ProjectAnalysis;
import tn.esprit.projet_module.repository.ProjectAnalysisRepository;
import tn.esprit.projet_module.service.ProjectService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analysis")
public class AnalysisController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_URL = "http://localhost:8000/api/analyze";
    @Autowired
    private ProjectAnalysisRepository repository;
    private final ProjectService projectService;

    public AnalysisController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * POST /analysis/analyze?projectId=8
     * Body: { "title": "...", "description": "...", "deadline": "2025-06-01" }
     *
     * - Appelle le service Python
     * - Sauvegarde les skills dans project_skills
     * - Sauvegarde l'analyse dans project_analysis
     * - Retourne le résultat complet au front
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(
            @RequestParam(required = false) Long projectId,
            @RequestBody Map<String, String> request) {
        try {
            // 1. Appel Python
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    PYTHON_URL, entity, Map.class
            );

            Map<String, Object> analysisResult = response.getBody();

            // 2. Sauvegarde si projectId fourni
            if (projectId != null && analysisResult != null) {
                Project project = projectService.getProject(projectId);

                // Sauvegarder les skills
                List<Map<String, Object>> skills =
                        (List<Map<String, Object>>) analysisResult.get("skills");
                if (skills != null) {
                    projectService.saveProjectSkills(project, skills);
                }

                // Sauvegarder l'analyse complète
                projectService.saveProjectAnalysis(project, analysisResult);
            }

            return ResponseEntity.ok(analysisResult);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Analysis service unavailable: " + e.getMessage()));
        }
    }

    /**
     * GET /analysis/{projectId}
     * Récupérer l'analyse sauvegardée d'un projet
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<?> getAnalysis(@PathVariable Long projectId) {
        try {
            return ResponseEntity.ok(projectService.getAnalysisByProject(projectId));
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Analysis not found for project " + projectId);
        }
    }
    @GetMapping("/{projectId}/analysis")
    public ProjectAnalysisDTO getProjectAnalysis(@PathVariable Long projectId) {

        ProjectAnalysis analysis = repository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        ProjectAnalysisDTO dto = new ProjectAnalysisDTO();

        dto.setComplexityLevel(analysis.getComplexityLevel());
        dto.setComplexityScore(analysis.getComplexityScore());
        dto.setFreelancersAvailability(analysis.getFreelancersAvailability());
        dto.setFreelancersEstimatedCount(analysis.getFreelancersEstimatedCount());
        dto.setRiskLevel(analysis.getRiskLevel());
        dto.setRiskScore(analysis.getRiskScore());

        return dto;
    }
}