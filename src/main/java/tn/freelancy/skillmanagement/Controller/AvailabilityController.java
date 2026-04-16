package tn.freelancy.skillmanagement.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.clients.UserDto;
import tn.freelancy.skillmanagement.clients.UserServiceClient;
import tn.freelancy.skillmanagement.entity.Availability;
import tn.freelancy.skillmanagement.service.AvailabilityService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {

    @Autowired
    private AvailabilityService availabilityService;

    @Autowired
    private UserServiceClient userServiceClient;

    // ✅ CREATE pour l'utilisateur connecté
    @PostMapping("/user/me")
    public ResponseEntity<?> createForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Availability availability) {
        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();
            Availability saved = availabilityService.createAvailability(userId, availability);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ AJOUTÉ : GET de la disponibilité de l'utilisateur connecté
    @GetMapping("/user/me")
    public ResponseEntity<?> getForCurrentUser(
            @RequestHeader("Authorization") String authorization) {
        try {
            UserDto currentUser = userServiceClient.getCurrentUser(authorization);
            Long userId = currentUser.getId();
            Availability availability = availabilityService.getAvailabilityByUserId(userId);
            return ResponseEntity.ok(availability);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<Availability> getAll() {
        return availabilityService.getAllAvailabilities();
    }

    @GetMapping("/{id}")
    public Availability getById(@PathVariable Long id) {
        return availabilityService.getAvailabilityById(id);
    }

    // ✅ CORRIGÉ : retourne ResponseEntity pour cohérence
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Availability availability) {
        try {
            Availability updated = availabilityService.updateAvailability(id, availability);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/preview")
    public Availability preview(@RequestBody Availability availability) {
        return availabilityService.calculatePreview(availability);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        availabilityService.deleteAvailability(id);
        return ResponseEntity.noContent().build(); // ✅ CORRIGÉ : 204 au lieu de void
    }
}