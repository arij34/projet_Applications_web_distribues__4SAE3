package tn.freelancy.skillmanagement.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.clients.UserDto;
import tn.freelancy.skillmanagement.clients.UserServiceClient;
import tn.freelancy.skillmanagement.dto.*;
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

    private final FreelancerSkillService freelancerSkillService;
    private final SkillMatcherService skillMatcherService;
    private final UserServiceClient userServiceClient;

    public FreelancerSkillController(FreelancerSkillService freelancerSkillService,
                                     SkillMatcherService skillMatcherService,
                                     UserServiceClient userServiceClient) {
        this.freelancerSkillService = freelancerSkillService;
        this.skillMatcherService = skillMatcherService;
        this.userServiceClient = userServiceClient;
    }

    // ✅ CREATE
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

            if (match != null && match.isSuggestion() && !forceCreate) {
                return ResponseEntity.ok(Map.of(
                        "type", "suggestion",
                        "message", "Did you mean?",
                        "suggestedSkill", match.getSkillName().getName(),
                        "confidence", match.getConfidence()
                ));
            }

            FreelancerSkill saved =
                    freelancerSkillService.createFreelancerSkill(userId, freelancerSkill, skillInput);

            return ResponseEntity.ok(Map.of(
                    "type", "success",
                    "data", buildSkillResponse(saved)
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ GET USER SKILLS
    @GetMapping("/user/me")
    public ResponseEntity<?> getAllForCurrentUser(
            @RequestHeader("Authorization") String authorization) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Long userId = currentUser.getId();

        return ResponseEntity.ok(
                freelancerSkillService.getFreelancerSkillsByUserId(userId)
        );
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        freelancerSkillService.deleteFreelancerSkill(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ LEVEL
    @GetMapping("/level/{years}")
    public ResponseEntity<Map<String, Object>> getLevel(@PathVariable int years) {

        Level level = freelancerSkillService.calculateLevel(years);

        Map<String, Object> response = new HashMap<>();
        response.put("years", years);
        response.put("level", level);
        response.put("label", level.name());

        return ResponseEntity.ok(response);
    }

    // ✅ DUPLICATES
    @GetMapping("/user/{userId}/duplicates")
    public ResponseEntity<List<DuplicateSkillDTO>> getDuplicateSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(freelancerSkillService.detectDuplicates(userId));
    }

    // ✅ CHECK SKILLS
    @PostMapping("/check-skills/me")
    public ResponseEntity<SkillCheckResponse> checkSkills(
            @RequestHeader("Authorization") String authorization,
            @RequestBody List<String> skills) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Long userId = currentUser.getId();

        return ResponseEntity.ok(
                freelancerSkillService.checkExistingSkills(userId, skills)
        );
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
}