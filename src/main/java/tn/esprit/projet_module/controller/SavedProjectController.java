package tn.esprit.projet_module.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projet_module.clients.UserDto;
import tn.esprit.projet_module.entity.Project;
import tn.esprit.projet_module.entity.SavedProject;
import tn.esprit.projet_module.repository.ProjectRepository;
import tn.esprit.projet_module.repository.SavedProjectRepository;
import tn.esprit.projet_module.service.UserContextService;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/saved-projects")
@CrossOrigin(origins = "http://localhost:4200")
public class SavedProjectController {

    private final SavedProjectRepository savedRepo;
    private final ProjectRepository projectRepo;
    private final UserContextService userContextService;

    public SavedProjectController(SavedProjectRepository savedRepo,
                                  ProjectRepository projectRepo,
                                  UserContextService userContextService) {
        this.savedRepo = savedRepo;
        this.projectRepo = projectRepo;
        this.userContextService = userContextService;
    }

    // ── Sauvegarder un projet (supporte freelancerId, keycloakId, ou Authorization header) ──
    @PostMapping
    public ResponseEntity<?> saveProject(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long freelancerId = body.get("freelancerId") != null ?
                Long.valueOf(body.get("freelancerId").toString()) : null;
        Long projectId = Long.valueOf(body.get("projectId").toString());

        // Resolve user from token if not provided in body
        if (freelancerId == null && authHeader != null && !authHeader.isBlank()) {
            UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
            if (user != null && user.getId() != null) {
                freelancerId = user.getId();
            }
        }

        if (freelancerId == null) {
            return ResponseEntity.badRequest().body("Provide freelancerId or Authorization header.");
        }
        if (savedRepo.existsByFreelancerIdAndProjectId(freelancerId, projectId)) {
            return ResponseEntity.badRequest().body("Project already saved.");
        }

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        SavedProject sp = new SavedProject();
        sp.setFreelancerId(freelancerId);
        sp.setProject(project);
        savedRepo.save(sp);

        return ResponseEntity.ok(Map.of("message", "Project saved successfully!"));
    }

    // ── Liste par freelancerId ──
    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<List<Project>> getSavedProjects(@PathVariable Long freelancerId) {
        List<Project> projects = savedRepo.findByFreelancerId(freelancerId)
                .stream()
                .map(SavedProject::getProject)
                .collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }

    // ── Liste par keycloakId ──
    @GetMapping("/freelancer/by-keycloak/{keycloakId}")
    public ResponseEntity<List<Project>> getSavedProjectsByKeycloak(
            @PathVariable String keycloakId) {
        List<Project> projects = savedRepo.findByFreelancerKeycloakId(keycloakId)
                .stream()
                .map(SavedProject::getProject)
                .collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }

    // ── Check par freelancerId ──
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkSaved(
            @RequestParam Long freelancerId,
            @RequestParam Long projectId) {
        boolean saved = savedRepo.existsByFreelancerIdAndProjectId(freelancerId, projectId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    // ── Check par keycloakId ──
    @GetMapping("/check-keycloak")
    public ResponseEntity<Map<String, Boolean>> checkSavedByKeycloak(
            @RequestParam String freelancerKeycloakId,
            @RequestParam Long projectId) {
        boolean saved = savedRepo.existsByFreelancerKeycloakIdAndProjectId(
                freelancerKeycloakId, projectId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    // ── Unsave par freelancerId ──
    @DeleteMapping
    public ResponseEntity<?> unsaveProject(@RequestParam Long freelancerId,
                                           @RequestParam Long projectId) {
        savedRepo.deleteByFreelancerIdAndProjectId(freelancerId, projectId);
        return ResponseEntity.ok(Map.of("message", "Project removed from saved list."));
    }

    // ── Unsave par keycloakId ──
    @DeleteMapping("/by-keycloak")
    public ResponseEntity<?> unsaveByKeycloak(
            @RequestParam String freelancerKeycloakId,
            @RequestParam Long projectId) {
        savedRepo.deleteByFreelancerKeycloakIdAndProjectId(freelancerKeycloakId, projectId);
        return ResponseEntity.ok(Map.of("message", "Project removed from saved list."));
    }

    @GetMapping
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Saved Project API is working");
    }

    // ── Current user's saved projects (uses User Service via Authorization, userId) ──
    @GetMapping("/me")
    public ResponseEntity<?> getMySavedProjects(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized. Provide valid Authorization header."));
        }
        List<Project> projects = savedRepo.findByFreelancerId(user.getId())
                .stream().map(SavedProject::getProject).collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }

    // ── Check saved by token ──
    @GetMapping("/check-me")
    public ResponseEntity<?> checkSavedMe(
            @RequestParam Long projectId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized.", "saved", false));
        }
        boolean saved = savedRepo.existsByFreelancerIdAndProjectId(user.getId(), projectId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    // ── Unsave by token ──
    @DeleteMapping("/me")
    public ResponseEntity<?> unsaveMe(
            @RequestParam Long projectId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized."));
        }
        savedRepo.deleteByFreelancerIdAndProjectId(user.getId(), projectId);
        return ResponseEntity.ok(Map.of("message", "Project removed from saved list."));
    }
}