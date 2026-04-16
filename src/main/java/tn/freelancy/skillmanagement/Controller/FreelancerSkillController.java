package tn.freelancy.skillmanagement.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.clients.UserDto;
import tn.freelancy.skillmanagement.clients.UserServiceClient;
import tn.freelancy.skillmanagement.dto.DuplicateSkillDTO;
import tn.freelancy.skillmanagement.dto.SkillCheckResponse;
import tn.freelancy.skillmanagement.dto.SkillMatchResult;
import tn.freelancy.skillmanagement.entity.FreelancerSkill;
import tn.freelancy.skillmanagement.entity.Level;
import tn.freelancy.skillmanagement.service.FreelancerSkillService;
import tn.freelancy.skillmanagement.service.SkillMatcherService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/freelancer-skill")
public class FreelancerSkillController {

    @Autowired
    private FreelancerSkillService freelancerSkillService;

    @Autowired
    private SkillMatcherService skillMatcherService;

    @Autowired
    private UserServiceClient userServiceClient;

    // ✅ CREATE (avec gestion suggestion)
    @PostMapping("/user/me")
    public ResponseEntity<?> createFreelancerSkillForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestParam String skillInput,
            @RequestParam(defaultValue = "false") boolean forceCreate,
            @RequestBody FreelancerSkill freelancerSkill) {

        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();

            SkillMatchResult match = skillMatcherService.findMatchOrSuggest(skillInput.trim());

            // 🔴 "Did you mean" → suggestion SANS création SAUF si forceCreate=true
            if (match != null && match.isSuggestion() && !forceCreate) {
                return ResponseEntity.ok(Map.of(
                        "type", "suggestion",
                        "message", "Did you mean?",
                        "suggestedSkill", match.getSkillName().getName(),
                        "confidence", match.getConfidence()
                ));
            }

            // Ici on crée le skill même s'il y a suggestion SI forceCreate=true
            FreelancerSkill saved = freelancerSkillService
                    .createFreelancerSkill(userId, freelancerSkill, skillInput);

            return ResponseEntity.ok(Map.of(
                    "type", "success",
                    "data", buildSkillResponse(saved)
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ CREATE CV
    @PostMapping("/CV/me")
    public ResponseEntity<?> createFreelancerSkillCVForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestParam String skillInput,
            @RequestBody FreelancerSkill freelancerSkill) {

        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();

            FreelancerSkill saved = freelancerSkillService
                    .createFreelancerSkillCv(userId, freelancerSkill, skillInput);

            return ResponseEntity.ok(Map.of(
                    "type", "success",
                    "data", buildSkillResponse(saved)
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ GET skills user connecté
    @GetMapping("/user/me")
    public ResponseEntity<?> getAllForCurrentUser(
            @RequestHeader("Authorization") String authorization) {

        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();

            List<FreelancerSkill> skills =
                    freelancerSkillService.getFreelancerSkillsByUserId(userId);

            return ResponseEntity.ok(skills);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        freelancerSkillService.deleteFreelancerSkill(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ LEVEL
    @GetMapping("/level/{years}")
    public ResponseEntity<Map<String, Object>> getLevelByYears(@PathVariable int years) {

        Level calculatedLevel = freelancerSkillService.calculateLevel(years);

        Map<String, Object> response = new HashMap<>();
        response.put("years", years);
        response.put("level", calculatedLevel.ordinal() + 1);
        response.put("label", calculatedLevel.name());

        return ResponseEntity.ok(response);
    }

    // ✅ DUPLICATES (corrigé)
    @GetMapping("/user/{userId}/duplicates")
    public ResponseEntity<List<DuplicateSkillDTO>> getDuplicateSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(freelancerSkillService.detectDuplicates(userId));
    }

    // ✅ CHECK SKILLS (unique API)
    @PostMapping("/check-skills/me")
    public ResponseEntity<SkillCheckResponse> checkSkillsForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestBody List<String> skills) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Long userId = currentUser.getId();

        SkillCheckResponse response =
                freelancerSkillService.checkExistingSkills(userId, skills);

        return ResponseEntity.ok(response);
    }

    // ===== HELPER =====
    private Map<String, Object> buildSkillResponse(FreelancerSkill saved) {

        Map<String, Object> response = new HashMap<>();

        response.put("id", saved.getId());
        response.put("level", saved.getLevel());
        response.put("yearsExperience", saved.getYearsExperience());

        response.put("skillName",
                saved.getSkill() != null
                        ? saved.getSkill().getName()
                        : saved.getCustomSkillName()
        );

        response.put("isCustom", saved.getSkill() == null);

        return response;
    }

    @PutMapping("/user/me/{id}")
    public ResponseEntity<?> updateFreelancerSkillForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestBody FreelancerSkill freelancerSkill) {

        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();

            // Sécurité : on vérifie que le skill appartient bien à cet utilisateur
            FreelancerSkill existing = freelancerSkillService.getFreelancerSkillById(id);
            if (existing == null || !existing.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized or not found"));
            }

            // On force : seul l'utilisateur connecté peut modifier le skill
            freelancerSkill.setId(id);
            freelancerSkill.setUserId(userId);

            FreelancerSkill updated = freelancerSkillService.updateFreelancerSkill(freelancerSkill);

            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFreelancerSkillById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authorization) {
        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            FreelancerSkill skill = freelancerSkillService.getFreelancerSkillById(id);
            // Optionnel : Sécuriser (vérifie que skill appartient bien au user connecté)
            if (skill == null || !skill.getUserId().equals(currentUser.getId())) {
                return ResponseEntity.status(404).body(Map.of("error", "Not found"));
            }
            return ResponseEntity.ok(skill);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}