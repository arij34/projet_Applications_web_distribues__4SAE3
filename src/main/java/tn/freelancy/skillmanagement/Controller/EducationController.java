package tn.freelancy.skillmanagement.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.clients.UserDto;
import tn.freelancy.skillmanagement.clients.UserServiceClient;
import tn.freelancy.skillmanagement.entity.Education;
import tn.freelancy.skillmanagement.service.EducationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/education")
public class EducationController {

    @Autowired
    private EducationService educationService;

    @Autowired
    private UserServiceClient userServiceClient;

    // ✅ CREATE pour l'utilisateur connecté
    @PostMapping("/user/me")
    public ResponseEntity<?> createEducationForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Education education) {
        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();
            Education saved = educationService.createEducation(userId, education);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ AJOUTÉ : GET toutes les formations de l'utilisateur connecté
    @GetMapping("/user/me")
    public ResponseEntity<?> getAllForCurrentUser(
            @RequestHeader("Authorization") String authorization) {
        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();
            List<Education> educations = educationService.getEducationsByUserId(userId);
            return ResponseEntity.ok(educations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ GET la plus récente pour l'utilisateur connecté
    @GetMapping("/user/me/latest")
    public ResponseEntity<?> getLatestEducationForCurrentUser(
            @RequestHeader("Authorization") String authorization) {
        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();
            Education education = educationService.getLatestEducation(userId);
            return ResponseEntity.ok(education);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<Education> getAll() {
        return educationService.getAllEducations();
    }

    @GetMapping("/{id}")
    public Education getById(@PathVariable Long id) {
        return educationService.getEducationById(id);
    }

    // ✅ CORRIGÉ : PUT avec @PathVariable /{id} (manquait dans l'original)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Education education) {
        try {
            education.setId(id);
            Education updated = educationService.updateEducation(education);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        educationService.deleteEducation(id);
        return ResponseEntity.noContent().build(); // ✅ CORRIGÉ : 204
    }
}