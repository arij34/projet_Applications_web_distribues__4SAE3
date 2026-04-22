package tn.esprit.skillvalidationservice.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.skillvalidationservice.entity.PendingSkill;
import tn.esprit.skillvalidationservice.service.PendingSkillService;

import java.util.List;

@RestController
@RequestMapping("/pending-skills")
@CrossOrigin(origins = "*")
public class PendingSkillController {

    private final PendingSkillService service;

    public PendingSkillController(PendingSkillService service) {
        this.service = service;
    }

    // GET tous les pending skills
    @GetMapping
    public ResponseEntity<List<PendingSkill>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // APPROVE
    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Long id) {
        service.approve(id);
        return ResponseEntity.ok().build();
    }

    // REJECT
    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        service.reject(id);
        return ResponseEntity.ok().build();
    }
}