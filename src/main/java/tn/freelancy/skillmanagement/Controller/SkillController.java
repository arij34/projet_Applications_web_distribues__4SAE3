package tn.freelancy.skillmanagement.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.dto.SkillMatchResult;
import tn.freelancy.skillmanagement.entity.Skill;
import tn.freelancy.skillmanagement.service.SkillMatcherService;
import tn.freelancy.skillmanagement.service.SkillService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/skills")
public class SkillController {

    private final SkillService skillService;
    private final SkillMatcherService skillMatcherService;

    public SkillController(SkillService skillService,
                           SkillMatcherService skillMatcherService) {
        this.skillService = skillService;
        this.skillMatcherService = skillMatcherService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Skill skill) {
        try {
            return ResponseEntity.ok(skillService.createSkill(skill));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<Skill> getAll() {
        return skillService.getAllSkills();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Skill skill = skillService.getSkillById(id);
        return skill != null ? ResponseEntity.ok(skill) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Skill skill) {

        Skill existing = skillService.getSkillById(id);

        if (existing == null) return ResponseEntity.notFound().build();

        existing.setName(skill.getName());
        existing.setNormalizedName(skill.getNormalizedName());
        existing.setCategory(skill.getCategory());

        return ResponseEntity.ok(skillService.updateSkill(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            skillService.deleteSkill(id);
            return ResponseEntity.ok(Map.of("message", "Skill deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ MATCH
    @GetMapping("/match")
    public ResponseEntity<?> matchSkill(@RequestParam String input) {

        if (input == null || input.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Input is empty"));
        }

        SkillMatchResult result = skillMatcherService.findMatchOrSuggest(input.trim());

        if (result == null) {
            return ResponseEntity.ok(Map.of("type", "no_match"));
        }

        return ResponseEntity.ok(Map.of(
                "type", result.isSuggestion() ? "suggestion" : "match",
                "skill", result.getSkillName() != null ? result.getSkillName().getName() : null,
                "confidence", result.getConfidence(),
                "exact", result.isExactMatch()
        ));
    }
}