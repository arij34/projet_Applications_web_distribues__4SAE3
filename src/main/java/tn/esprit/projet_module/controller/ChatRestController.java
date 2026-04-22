package tn.esprit.projet_module.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.esprit.projet_module.entity.ChatMessage;
import tn.esprit.projet_module.repository.ChatMessageRepository;
import tn.esprit.projet_module.repository.ProjectRepository;

import java.util.*;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    private final ChatMessageRepository messageRepo;
    private final ProjectRepository projectRepo;   // ← AJOUT
    private final RestTemplate restTemplate;

    public ChatRestController(ChatMessageRepository messageRepo,
                              ProjectRepository projectRepo) {   // ← AJOUT
        this.messageRepo  = messageRepo;
        this.projectRepo  = projectRepo;            // ← AJOUT
        this.restTemplate = new RestTemplate();
    }

    // ── Historique ────────────────────────────────────
    @GetMapping("/{projectId}/history")
    public List<ChatMessage> getHistory(@PathVariable Long projectId) {
        return messageRepo.findByProjectIdOrderBySentAtAsc(projectId);
    }

    // ── Phase sauvegardée ─────────────────────────────  ← AJOUT
    @GetMapping("/{projectId}/phase")
    public ResponseEntity<Map<String, String>> getPhase(@PathVariable Long projectId) {
        return projectRepo.findById(projectId).map(p -> {
            Map<String, String> result = new HashMap<>();
            result.put("phase", p.getCurrentPhase() != null ? p.getCurrentPhase() : "OPEN");
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.ok(Map.of("phase", "OPEN")));
    }

    // ── Analyse IA ────────────────────────────────────
    @GetMapping("/{projectId}/analyze")
    public ResponseEntity<?> analyzeDiscussion(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "Project") String projectTitle) {

        List<ChatMessage> messages =
                messageRepo.findByProjectIdOrderBySentAtAsc(projectId);

        if (messages.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("summary", "No messages yet in this discussion.");
            empty.put("phase", "ETUDE");
            empty.put("phase_reason", "No discussion started yet.");
            empty.put("progress_percent", 0);
            empty.put("key_points", new ArrayList<>());
            return ResponseEntity.ok(empty);
        }

        // Prépare les messages pour Python
        List<Map<String, String>> msgList = new ArrayList<>();
        for (ChatMessage m : messages) {
            Map<String, String> item = new HashMap<>();
            item.put("senderName", m.getSenderName() != null ? m.getSenderName() : "Unknown");
            item.put("senderRole", m.getSenderRole() != null ? m.getSenderRole() : "CLIENT");
            item.put("content",    m.getContent()    != null ? m.getContent()    : "");
            msgList.add(item);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("projectTitle", projectTitle);
        body.put("messages", msgList);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://localhost:8000/analyze-discussion",
                    request,
                    Map.class
            );

            Map<String, Object> result = response.getBody();

            // ── Sauvegarde la phase détectée en base ──  ← AJOUT
            if (result != null && result.containsKey("phase")) {
                String detectedPhase = (String) result.get("phase");
                projectRepo.findById(projectId).ifPresent(p -> {
                    p.setCurrentPhase(detectedPhase);
                    projectRepo.save(p);
                });
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ AI service error: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("summary", "AI analysis unavailable.");
            error.put("phase", "ETUDE");
            error.put("phase_reason", "Error: " + e.getMessage());
            error.put("progress_percent", 0);
            error.put("key_points", new ArrayList<>());
            return ResponseEntity.ok(error);
        }
    }
}