package tn.esprit.projet_module.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projet_module.clients.ProjectSkillDTO;
import tn.esprit.projet_module.entity.ProjectSkill;
import tn.esprit.projet_module.repository.ProjectSkillRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/projects")
public class ProjectSkillController {

    @Autowired
    private ProjectSkillRepository projectSkillRepository;

    // ✅ API utilisée par ton MatchingService
    @GetMapping("/{projectId}/skills")
    public List<ProjectSkillDTO> getProjectSkills(@PathVariable Long projectId) {

        List<ProjectSkill> skills = projectSkillRepository.findByProjectId(projectId);

        return skills.stream()
                .map(skill -> new ProjectSkillDTO(
                        skill.getSkillName(),
                        skill.getCategory(),
                        skill.getDemand()
                ))
                .collect(Collectors.toList());
    }
}