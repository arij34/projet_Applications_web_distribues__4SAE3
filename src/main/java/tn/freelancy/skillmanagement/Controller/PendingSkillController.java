package tn.freelancy.skillmanagement.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.entity.PendingSkill;
import tn.freelancy.skillmanagement.service.PendingSkillService;

import java.util.List;

@RestController
@RequestMapping("/pending-skills")
public class PendingSkillController {

    @Autowired
    private PendingSkillService service;

    @GetMapping
    public List<PendingSkill> getDrafts() {
        return service.getAllDrafts();
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        service.approvePendingSkill(id);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        service.reject(id);
    }
}