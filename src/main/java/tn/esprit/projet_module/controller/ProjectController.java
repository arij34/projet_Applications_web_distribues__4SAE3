package tn.esprit.projet_module.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projet_module.clients.InvitationProjectDTO;
import tn.esprit.projet_module.clients.UserDto;
import tn.esprit.projet_module.clients.UserServiceClient;
import tn.esprit.projet_module.entity.*;
import tn.esprit.projet_module.service.EmailService;
import tn.esprit.projet_module.service.ProjectService;
import tn.esprit.projet_module.service.ProposalService;
import tn.esprit.projet_module.service.UserContextService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ProposalService proposalService;
    private final UserContextService userContextService;
    private final UserServiceClient userServiceClient;
    private final EmailService emailService;

    public ProjectController(ProjectService projectService,
                             ProposalService proposalService,
                             UserContextService userContextService,
                             UserServiceClient userServiceClient,
                             EmailService emailService) {
        this.projectService = projectService;
        this.proposalService = proposalService;
        this.userContextService = userContextService;
        this.userServiceClient = userServiceClient;
        this.emailService = emailService;
    }

    @GetMapping("/test-user-service")
    public Map<String, String> testUserService() {
        return userServiceClient.ping();
    }

    @GetMapping
    public List<Project> getAll() { return projectService.getAllProjects(); }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> create(
            @RequestBody Project project,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Resolve client from User Service via token
        if (authHeader != null && !authHeader.isBlank()) {
            UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
            if (user != null && user.getId() != null) {
                project.setClientId(user.getId());
                if (user.getEmail() != null) project.setClientEmail(user.getEmail());
            }
        }
        if (project.getClientId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Provide clientId in body or Authorization header."));
        }
        return ResponseEntity.ok(projectService.createProject(project));
    }

    @GetMapping("/{id}")
    public Project getById(@PathVariable Long id) { return projectService.getProject(id); }

    /**
     * Freelancer joins a project (creates proposal).
     * Uses the real connected user from Authorization header (User Service + Keycloak JWT).
     */
    @PostMapping("/{projectId}/join")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> joinProject(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error",
                    "Unauthorized. Provide valid Authorization header (Bearer token). User Service must be running."));
        }
        Long freelancerId = user.getId();
        try {
            Double bidAmount = body.get("bidAmount") != null ? Double.valueOf(body.get("bidAmount").toString()) : 0.0;
            Integer deliveryWeeks = body.get("deliveryWeeks") != null ? Integer.valueOf(body.get("deliveryWeeks").toString()) : 0;
            String coverLetter = body.getOrDefault("coverLetter", "").toString();
            String portfolioUrl = body.getOrDefault("portfolioUrl", "").toString();
            String questionToClient = body.getOrDefault("questionToClient", "").toString();
            LocalDate availableFrom = null;
            if (body.get("availableFrom") != null && !body.get("availableFrom").toString().isEmpty()) {
                availableFrom = LocalDate.parse(body.get("availableFrom").toString());
            }
            Proposal p = proposalService.joinProject(projectId, freelancerId, bidAmount, deliveryWeeks,
                    coverLetter, portfolioUrl, questionToClient, availableFrom);

            // Send confirmation email to freelancer
            String freelancerEmail = user.getEmail();
            if (freelancerEmail != null && !freelancerEmail.isBlank()) {
                String freelancerName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();
                if (freelancerName.isBlank()) freelancerName = "Freelancer";
                String projectTitle = p.getProject().getTitle();
                emailService.sendProposalSubmitted(freelancerEmail, freelancerName, projectTitle, p.getBidAmount());
            }

            return ResponseEntity.ok(Map.of("message", "You joined the project successfully!", "proposalId", p.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get proposals for a project. Client: use Authorization header. Or pass clientId to verify.
     */
    @GetMapping("/{projectId}/proposals")
    public ResponseEntity<?> getProjectProposals(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long clientId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Project project = projectService.getProject(projectId);
        // Verify access: client can view proposals for their project
        if (authHeader != null && !authHeader.isBlank()) {
            UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
            if (user != null && user.getId() != null) {
                if (!project.getClientId().equals(user.getId())) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied. Not your project."));
                }
            }
        } else if (clientId != null && !project.getClientId().equals(clientId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied."));
        }
        List<Proposal> proposals = proposalService.getProposalsByProjectId(projectId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Proposal prop : proposals) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", prop.getId());
            m.put("freelancerId", prop.getFreelancerId());
            m.put("bidAmount", prop.getBidAmount());
            m.put("deliveryWeeks", prop.getDeliveryWeeks());
            m.put("availableFrom", prop.getAvailableFrom());
            m.put("portfolioUrl", prop.getPortfolioUrl());
            m.put("coverLetter", prop.getCoverLetter());
            m.put("questionToClient", prop.getQuestionToClient());
            m.put("status", prop.getStatus());
            m.put("createdAt", prop.getCreatedAt());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Get participants (freelancers) of a project by project ID.
     * Optional: ?status=ACCEPTED to get only accepted participants.
     */
    @GetMapping("/{projectId}/participants")
    public ResponseEntity<?> getProjectParticipants(
            @PathVariable Long projectId,
            @RequestParam(required = false) String status) {
        Project project = projectService.getProject(projectId);
        List<Proposal> proposals = proposalService.getProposalsByProjectId(projectId);
        if (status != null && !status.isEmpty()) {
            try {
                ProposalStatus filterStatus = ProposalStatus.valueOf(status.toUpperCase());
                proposals = proposals.stream()
                        .filter(p -> p.getStatus() == filterStatus)
                        .toList();
            } catch (IllegalArgumentException ignored) {}
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Proposal prop : proposals) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("freelancerId", prop.getFreelancerId());
            m.put("proposalId", prop.getId());
            m.put("status", prop.getStatus().name());
            m.put("bidAmount", prop.getBidAmount());
            m.put("deliveryWeeks", prop.getDeliveryWeeks());
            m.put("coverLetter", prop.getCoverLetter());
            m.put("createdAt", prop.getCreatedAt());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/client/{clientId}")
    public List<Project> getByClient(@PathVariable Long clientId) { return projectService.getProjectsByClient(clientId); }

    @PutMapping("/{id}")
    public Project update(@PathVariable Long id, @RequestBody Project project) { return projectService.updateProject(id, project); }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Project project = projectService.getProject(id);
        if (project.getStatus() != ProjectStatus.DRAFT) {
            return ResponseEntity.status(403).body("Cannot delete a non-DRAFT project directly.");
        }
        projectService.deleteProject(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/delete-request")
    public ResponseEntity<?> requestDelete(@PathVariable Long id) {
        projectService.requestDelete(id);
        return ResponseEntity.ok("Delete request sent to admin.");
    }

    @PutMapping("/{id}/status/{status}")
    public Project changeStatus(@PathVariable Long id, @PathVariable ProjectStatus status) {
        return projectService.changeStatus(id, status);
    }

    @GetMapping("/delete-requests")
    public List<Project> getDeleteRequests() { return projectService.getDeleteRequests(); }

    @PutMapping("/{id}/delete-request/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveDelete(@PathVariable Long id) {
        projectService.approveDelete(id);
        return ResponseEntity.ok("Project deleted after admin approval.");
    }

    @PutMapping("/{id}/delete-request/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectDelete(@PathVariable Long id) {
        projectService.rejectDelete(id);
        return ResponseEntity.ok("Delete request rejected.");
    }

    @GetMapping("/delete-history")
    public List<ProjectHistory> getDeleteHistory() { return projectService.getDeleteHistory(); }

    @PostMapping("/{id}/skills")
    public ResponseEntity<?> saveSkills(@PathVariable Long id,
                                        @RequestBody List<Map<String, Object>> skills) {
        try {
            Project project = projectService.getProject(id);
            projectService.saveProjectSkills(project, skills);
            return ResponseEntity.ok("Skills saved successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error saving skills: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/analysis")
    public ResponseEntity<?> saveAnalysis(@PathVariable Long id,
                                          @RequestBody Map<String, Object> analysisData) {
        try {
            Project project = projectService.getProject(id);
            projectService.saveProjectAnalysis(project, analysisData);
            return ResponseEntity.ok("Analysis saved successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error saving analysis: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<?> getAnalysis(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(projectService.getAnalysisByProject(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Analysis not found.");
        }
    }

    @GetMapping("/{projectId}/workspace/access")
    public ResponseEntity<Map<String, Object>> checkWorkspaceAccess(
            @PathVariable Long projectId,
            @RequestParam Long userId,
            @RequestParam String role) {

        Map<String, Object> response = new HashMap<>();

        if ("CLIENT".equals(role)) {
            Project project = projectService.getProject(projectId);
            boolean isOwner = project.getClientId().equals(userId);
            response.put("allowed", isOwner);
            response.put("reason", isOwner ? "ok" : "Not your project");

        } else if ("FREELANCER".equals(role)) {
            boolean hasAccepted = proposalService.hasAcceptedProposal(projectId, userId); // ← méthode correcte
            response.put("allowed", hasAccepted);
            response.put("reason", hasAccepted ? "ok" : "No accepted proposal");

        } else {
            response.put("allowed", false);
            response.put("reason", "Unknown role");
        }

        return ResponseEntity.ok(response);
    }
    @GetMapping("/client/by-email/{email}")
    public List<Project> getByClientEmail(@PathVariable String email) {
        return projectService.getProjectsByClientEmail(email);
    }
    @GetMapping("/client/by-keycloak/{keycloakId}")
    public List<Project> getByKeycloakId(@PathVariable String keycloakId) {
        return projectService.getProjectsByKeycloakId(keycloakId);
    }
    @GetMapping("/freelancer/by-keycloak/{keycloakId}/accepted")
    public List<Project> getAcceptedByFreelancerKeycloak(@PathVariable String keycloakId) {
        return projectService.getAcceptedProjectsByFreelancerKeycloakId(keycloakId);
    }

    // ── Current user's projects (uses User Service via Authorization, userId) ──
    @GetMapping("/client/me")
    public ResponseEntity<?> getMyProjectsAsClient(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized. Provide valid Authorization header."));
        }
        return ResponseEntity.ok(projectService.getProjectsByClient(user.getId()));
    }

    @GetMapping("/freelancer/me/accepted")
    public ResponseEntity<?> getMyAcceptedProjectsAsFreelancer(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserDto user = userContextService.resolveCurrentUser(userContextService.ensureBearer(authHeader));
        if (user == null || user.getId() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized. Provide valid Authorization header."));
        }
        return ResponseEntity.ok(projectService.getAcceptedProjectsByFreelancerId(user.getId()));
    }
    @GetMapping("/{id}/invitation-data")
    public ResponseEntity<InvitationProjectDTO> getInvitationData(@PathVariable Long id) {

        Project project = projectService.getProject(id);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }

        InvitationProjectDTO dto = new InvitationProjectDTO();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setDeadline(project.getDeadline() != null
                ? project.getDeadline().toString() : null);

        String clientName = null;
        String clientEmail = project.getClientEmail();

        try {
            Long clientId = project.getClientId();
            if (clientId != null) {
                // 🔹 utiliser la méthode existante : getUserById(String id, String token)
                Map<String, Object> userMap = userServiceClient.getUserById(
                        clientId,
                        ""        // ou null / token si tu en as besoin
                );

                if (userMap != null) {
                    Object firstObj = userMap.get("firstName");
                    Object lastObj  = userMap.get("lastName");
                    Object emailObj = userMap.get("email");

                    String first = firstObj != null ? firstObj.toString() : "";
                    String last  = lastObj  != null ? lastObj.toString()  : "";
                    String full  = (first + " " + last).trim();
                    if (!full.isEmpty()) {
                        clientName = full;
                    }

                    if (emailObj != null && !emailObj.toString().isBlank()) {
                        clientEmail = emailObj.toString();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur récupération client pour invitation-data: " + e.getMessage());
        }

        if (clientName == null || clientName.isBlank()) {
            clientName = "Client";
        }

        dto.setClientName(clientName);
        dto.setClientEmail(clientEmail);

        // Skills
        if (project.getSkills() != null) {
            dto.setRequiredSkills(project.getSkills().stream()
                    .map(ProjectSkill::getSkillName)
                    .collect(java.util.stream.Collectors.toList()));
        }

        // Budget + Duration
        if (project.getAnalysis() != null) {
            ProjectAnalysis analysis = project.getAnalysis();
            dto.setBudgetMin(analysis.getBudgetMin());
            dto.setBudgetMax(analysis.getBudgetMax());
            dto.setBudgetRecommended(analysis.getBudgetRecommended());
            dto.setDurationEstimatedWeeks(analysis.getDurationEstimatedWeeks());
        }

        return ResponseEntity.ok(dto);
    }


}