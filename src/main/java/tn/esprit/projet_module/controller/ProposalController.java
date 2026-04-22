package tn.esprit.projet_module.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import tn.esprit.projet_module.clients.MatchingProposalRequest;
import tn.esprit.projet_module.entity.*;
import tn.esprit.projet_module.repository.*;
import tn.esprit.projet_module.service.EmailService;
import tn.esprit.projet_module.service.FreelancerInfoService;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/proposals")
public class ProposalController {

    private final EmailService          emailService;
    private final ProposalRepository    proposalRepo;
    private final ProjectRepository     projectRepo;
    private final FreelancerInfoService freelancerInfoService;

    // ✅ WebClient vers le microservice contrat (port 8087)
    private final WebClient webClient = WebClient.builder()
            .baseUrl("http://localhost:8087")
            .build();

    public ProposalController(ProposalRepository proposalRepo,
                              ProjectRepository projectRepo,
                              EmailService emailService,
                              FreelancerInfoService freelancerInfoService) {
        this.proposalRepo          = proposalRepo;
        this.projectRepo           = projectRepo;
        this.emailService          = emailService;
        this.freelancerInfoService = freelancerInfoService;
    }

    // ── Soumettre une proposition ─────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> submitProposal(@RequestBody Map<String, Object> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Request body is required."));
        }
        Object rawProjectId     = body.get("projectId");
        Object rawFreelancerId  = body.get("freelancerId");
        Object rawBidAmount     = body.get("bidAmount");
        Object rawDeliveryWeeks = body.get("deliveryWeeks");

        if (rawProjectId == null || rawFreelancerId == null
                || rawBidAmount == null || rawDeliveryWeeks == null) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Missing required fields: projectId, freelancerId, bidAmount, deliveryWeeks."));
        }

        Long projectId; Long freelancerId; Double bidAmount; Integer deliveryWeeks;
        try {
            projectId     = Long.valueOf(rawProjectId.toString());
            freelancerId  = Long.valueOf(rawFreelancerId.toString());
            bidAmount     = Double.valueOf(rawBidAmount.toString());
            deliveryWeeks = Integer.valueOf(rawDeliveryWeeks.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid number format: " + e.getMessage()));
        }

        if (proposalRepo.existsByProjectIdAndFreelancerId(projectId, freelancerId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "You already submitted a proposal for this project."));
        }

        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Proposal p = new Proposal();
        p.setProject(project);
        p.setFreelancerId(freelancerId);
        p.setBidAmount(bidAmount);
        p.setDeliveryWeeks(deliveryWeeks);
        p.setCoverLetter(body.get("coverLetter") != null
                ? body.get("coverLetter").toString().trim() : "");
        p.setPortfolioUrl(safeString(body.get("portfolioUrl")));
        p.setQuestionToClient(safeString(body.get("questionToClient")));

        if (body.get("freelancerKeycloakId") != null
                && !body.get("freelancerKeycloakId").toString().trim().isEmpty()) {
            p.setFreelancerKeycloakId(body.get("freelancerKeycloakId").toString().trim());
        }

        Object av = body.get("availableFrom");
        if (av != null && !av.toString().trim().isEmpty()) {
            try {
                p.setAvailableFrom(LocalDate.parse(av.toString().trim()));
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid availableFrom date (use yyyy-MM-dd)."));
            }
        }

        proposalRepo.save(p);
        return ResponseEntity.ok(Map.of("message", "Proposal submitted successfully!"));
    }

    private static String safeString(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    // ── Propositions d'un projet ──────────────────────────────────────────────
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long clientId) {

        projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Proposal> proposals = proposalRepo.findByProjectId(projectId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Proposal prop : proposals) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",               prop.getId());
            m.put("freelancerId",     prop.getFreelancerId());
            m.put("bidAmount",        prop.getBidAmount());
            m.put("deliveryWeeks",    prop.getDeliveryWeeks());
            m.put("availableFrom",    prop.getAvailableFrom());
            m.put("portfolioUrl",     prop.getPortfolioUrl());
            m.put("coverLetter",      prop.getCoverLetter());
            m.put("questionToClient", prop.getQuestionToClient());
            m.put("status",           prop.getStatus());
            m.put("createdAt",        prop.getCreatedAt());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ── Propositions d'un freelancer ──────────────────────────────────────────
    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<List<Proposal>> getByFreelancer(@PathVariable Long freelancerId) {
        return ResponseEntity.ok(proposalRepo.findByFreelancerId(freelancerId));
    }

    // ── Vérifier si déjà soumis (par freelancerId) ────────────────────────────
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkProposal(
            @RequestParam Long projectId,
            @RequestParam Long freelancerId) {
        boolean exists = proposalRepo.existsByProjectIdAndFreelancerId(projectId, freelancerId);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("hasProposal", exists);
        if (exists) {
            proposalRepo.findByProjectIdAndFreelancerId(projectId, freelancerId)
                    .ifPresent(p -> res.put("status", p.getStatus()));
        }
        return ResponseEntity.ok(res);
    }

    // ── Vérifier si déjà soumis (par keycloakId) ─────────────────────────────
    @GetMapping("/check-by-keycloak")
    public ResponseEntity<?> checkByKeycloak(
            @RequestParam Long projectId,
            @RequestParam String keycloakId) {
        boolean exists = proposalRepo
                .existsByProjectIdAndFreelancerKeycloakId(projectId, keycloakId);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("hasProposal", exists);
        if (exists) {
            proposalRepo.findByProjectIdAndFreelancerKeycloakId(projectId, keycloakId)
                    .ifPresent(p -> res.put("status", p.getStatus().name()));
        } else {
            res.put("status", "");
        }
        return ResponseEntity.ok(res);
    }

    // ── Compter les propositions d'un projet ──────────────────────────────────
    @GetMapping("/count/{projectId}")
    public ResponseEntity<Map<String, Object>> countProposals(@PathVariable Long projectId) {
        return ResponseEntity.ok(Map.of("count", proposalRepo.countByProjectId(projectId)));
    }

    // ── Accepter / Rejeter (côté client) ─────────────────────────────────────
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return proposalRepo.findById(id).map(p -> {

            ProposalStatus newStatus = ProposalStatus.valueOf(body.get("status"));
            p.setStatus(newStatus);
            proposalRepo.save(p);

            Project project       = p.getProject();
            String  projectTitle  = project.getTitle();

            // ── Récupère infos freelancer depuis Keycloak ──────────────────────
            String freelancerEmail = null;
            String freelancerName  = "Freelancer";
            String keycloakId      = p.getFreelancerKeycloakId();

            if (keycloakId != null && !keycloakId.isBlank()) {
                Map<String, String> info = freelancerInfoService.getFreelancerInfo(keycloakId);
                freelancerEmail = info.get("email");
                freelancerName  = info.getOrDefault("fullName", "Freelancer");
            }

            // ── Si ACCEPTED → créer le contrat automatiquement ────────────────
            if (newStatus == ProposalStatus.ACCEPTED) {

                LocalDate startDate = p.getAvailableFrom() != null ? p.getAvailableFrom() : LocalDate.now();
                LocalDate endDate   = startDate.plusWeeks(
                        p.getDeliveryWeeks() != null ? p.getDeliveryWeeks() : 4
                );

                // ✅ Body du contrat — correspond exactement à ContractCreateRequest
                Map<String, Object> contractBody = new LinkedHashMap<>();
                contractBody.put("title",        "Contract — " + projectTitle + " / " + freelancerName);
                contractBody.put("description",  project.getDescription() != null
                        ? project.getDescription()
                        : "Contract generated automatically on proposal acceptance.");
                contractBody.put("projectId",    project.getId());
                contractBody.put("proposalId",   p.getId());
                contractBody.put("freelancerId", p.getFreelancerId());
                Long clientId = extractUserIdFromToken(authHeader);
                contractBody.put("clientId", clientId != null ? clientId : 0L);
                contractBody.put("totalAmount",  p.getBidAmount());
                contractBody.put("currency",     "TND");
                contractBody.put("startDate",    startDate.toString());
                contractBody.put("endDate",      endDate.toString());
                contractBody.put("deadline",     project.getDeadline() != null
                        ? project.getDeadline().toString()
                        : endDate.toString());
                contractBody.put("milestones",   List.of());

                // ✅ Appel vers /api/contracts/internal — sans vérification de rôle
                System.out.println("📄 Création automatique du contrat pour projet #"
                        + project.getId() + " / freelancer #" + p.getFreelancerId());

                webClient.post()
                        .uri("/api/contracts/internal")
                        .header("Content-Type", "application/json")
                        .bodyValue(contractBody)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .subscribe(
                                res -> System.out.println("✅ Contrat créé automatiquement : " + res),
                                err -> System.err.println("❌ Erreur création contrat : " + err.getMessage())
                        );

                // ── Email d'acceptation ────────────────────────────────────────
                if (freelancerEmail != null && !freelancerEmail.isBlank()) {
                    emailService.sendProposalAccepted(
                            freelancerEmail, freelancerName, projectTitle, p.getBidAmount()
                    );
                    System.out.println("📧 Email acceptation envoyé à : " + freelancerEmail);
                }

                return ResponseEntity.ok(Map.of(
                        "message", "Proposal accepted, contract creation triggered, email sent."
                ));
            }

            // ── Si REJECTED → email de rejet ──────────────────────────────────
            if (newStatus == ProposalStatus.REJECTED) {
                if (freelancerEmail != null && !freelancerEmail.isBlank()) {
                    emailService.sendProposalRejected(
                            freelancerEmail, freelancerName, projectTitle
                    );
                    System.out.println("📧 Email rejet envoyé à : " + freelancerEmail);
                }
                return ResponseEntity.ok(Map.of(
                        "message", "Proposal rejected, email sent."
                ));
            }

            return ResponseEntity.ok(Map.of("message", "Status updated."));

        }).orElse(ResponseEntity.notFound().build());
    }
    private Long extractUserIdFromToken(String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
            String token = authHeader.substring(7);
            // Decode JWT payload (base64)
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> claims = mapper.readValue(payload, Map.class);
            // Cherche "userId" ou "sub" ou "id" selon ce que ton Keycloak met dans le token
            Object userId = claims.get("userId");
            if (userId == null) userId = claims.get("id");
            return userId != null ? Long.valueOf(userId.toString()) : null;
        } catch (Exception e) {
            System.err.println("⚠️ Impossible d'extraire userId du token : " + e.getMessage());
            return null;
        }
    }
    // ── Projets acceptés par freelancerId ─────────────────────────────────────
    @GetMapping("/freelancer/{freelancerId}/accepted-projects")
    public ResponseEntity<List<Map<String, Object>>> getAcceptedProjects(
            @PathVariable Long freelancerId) {
        List<Proposal> accepted = proposalRepo
                .findByFreelancerIdAndStatus(freelancerId, ProposalStatus.ACCEPTED);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Proposal p : accepted) {
            Project proj = p.getProject();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          proj.getId());
            m.put("title",       proj.getTitle());
            m.put("description", proj.getDescription());
            m.put("deadline",    proj.getDeadline());
            m.put("status",      proj.getStatus() != null ? proj.getStatus().name() : null);
            m.put("clientId",    proj.getClientId());
            m.put("createdAt",   proj.getCreatedAt());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ── Projets acceptés par keycloakId ──────────────────────────────────────
    @GetMapping("/freelancer/by-keycloak/{keycloakId}/accepted-projects")
    public ResponseEntity<List<Map<String, Object>>> getAcceptedProjectsByKeycloak(
            @PathVariable String keycloakId) {
        List<Proposal> accepted = proposalRepo
                .findByFreelancerKeycloakIdAndStatus(keycloakId, ProposalStatus.ACCEPTED);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Proposal p : accepted) {
            Project proj = p.getProject();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          proj.getId());
            m.put("title",       proj.getTitle());
            m.put("description", proj.getDescription());
            m.put("deadline",    proj.getDeadline());
            m.put("status",      proj.getStatus() != null ? proj.getStatus().name() : null);
            m.put("clientId",    proj.getClientId());
            m.put("createdAt",   proj.getCreatedAt());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ── Propositions par keycloakId ───────────────────────────────────────────
    @GetMapping("/freelancer/keycloak/{keycloakId}")
    public ResponseEntity<List<Proposal>> getByFreelancerKeycloak(
            @PathVariable String keycloakId) {
        return ResponseEntity.ok(proposalRepo.findByFreelancerKeycloakId(keycloakId));
    }
    // Dans ProposalController.java — ajoutez ce endpoint
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return proposalRepo.findById(id).map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            p.getId());
            m.put("freelancerId",  p.getFreelancerId());
            m.put("bidAmount",     p.getBidAmount());
            m.put("deliveryWeeks", p.getDeliveryWeeks());
            m.put("availableFrom", p.getAvailableFrom()); // ✅ clé utilisée par le front
            m.put("coverLetter",   p.getCoverLetter());
            m.put("status",        p.getStatus().name());
            m.put("createdAt",     p.getCreatedAt());
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Freelancers acceptés pour un projet ──────────────────────────────────
    @GetMapping("/project/{projectId}/accepted")
    public ResponseEntity<List<Map<String, Object>>> getAcceptedByProject(
            @PathVariable Long projectId) {

        List<Proposal> accepted = proposalRepo
                .findByProjectIdAndStatus(projectId, ProposalStatus.ACCEPTED);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Proposal p : accepted) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            p.getId());         // proposalId
            m.put("freelancerId",  p.getFreelancerId());
            m.put("bidAmount",     p.getBidAmount());
            m.put("deliveryWeeks", p.getDeliveryWeeks());
            m.put("availableFrom", p.getAvailableFrom());
            m.put("status",        p.getStatus().name());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/matching")
    public ResponseEntity<?> submitProposalFromMatching(@RequestBody MatchingProposalRequest req) {

        if (req.getProjectId() == null || req.getFreelancerId() == null ||
                req.getBidAmount() == null || req.getDeliveryWeeks() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "projectId, freelancerId, bidAmount and deliveryWeeks are required"
            ));
        }

        // Vérifier si déjà proposée
        if (proposalRepo.existsByProjectIdAndFreelancerId(req.getProjectId(), req.getFreelancerId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Proposal already exists for this project & freelancer"));
        }

        Project project = projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Proposal p = new Proposal();
        p.setProject(project);
        p.setFreelancerId(req.getFreelancerId());
        p.setBidAmount(req.getBidAmount());
        p.setDeliveryWeeks(req.getDeliveryWeeks());

        // availableFrom optionnel
        if (req.getAvailableFrom() != null && !req.getAvailableFrom().isBlank()) {
            try {
                p.setAvailableFrom(LocalDate.parse(req.getAvailableFrom().trim()));
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid availableFrom date (use yyyy-MM-dd)"));
            }
        }

        p.setCoverLetter(req.getCoverLetter() != null ? req.getCoverLetter().trim() : "");
        p.setQuestionToClient(req.getQuestionToClient() != null ? req.getQuestionToClient().trim() : null);

        // 🔹 Copier le Keycloak ID du freelancer (envoyé par le matching module)
        if (req.getFreelancerKeycloakId() != null && !req.getFreelancerKeycloakId().isBlank()) {
            p.setFreelancerKeycloakId(req.getFreelancerKeycloakId().trim());
        }

        // status par défaut = PENDING (défini dans l'entité)
        proposalRepo.save(p);

        return ResponseEntity.ok(Map.of(
                "message", "Proposal created from matching",
                "proposalId", p.getId()
        ));
    }

    @GetMapping("/by-project-and-freelancer")
    public ResponseEntity<Map<String, Object>> getByProjectAndFreelancer(
            @RequestParam Long projectId,
            @RequestParam Long freelancerId) {

        return proposalRepo.findByProjectIdAndFreelancerId(projectId, freelancerId)
                .map(p -> ResponseEntity.ok(Map.<String, Object>of(
                        "id", p.getId(),
                        "status", p.getStatus() != null ? p.getStatus().name() : null
                )))
                .orElse(ResponseEntity.status(404).body(
                        Map.of("error", "Proposal not found")
                ));
    }

}