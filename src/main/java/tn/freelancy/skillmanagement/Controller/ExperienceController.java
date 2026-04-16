package tn.freelancy.skillmanagement.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.clients.UserDto;
import tn.freelancy.skillmanagement.clients.UserServiceClient;
import tn.freelancy.skillmanagement.entity.Experience;
import tn.freelancy.skillmanagement.service.ExperienceService;

import java.util.List;

@RestController
@RequestMapping("/experience")
public class ExperienceController {

    @Autowired
    private ExperienceService experienceService;

    @Autowired
    private UserServiceClient userServiceClient;

    // ✅ CREATE
    @PostMapping("/user/me")
    public Experience createForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Experience experience) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        return experienceService.createExperience(currentUser.getId(), experience);
    }

    // ✅ GET MY EXPERIENCES
    @GetMapping("/user/me")
    public List<Experience> getMyExperiences(
            @RequestHeader("Authorization") String authorization) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        return experienceService.getExperiencesByUserId(currentUser.getId());
    }

    // ✅ UPDATE sécurisé
    @PutMapping("/user/me")
    public Experience updateForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Experience experience) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        return experienceService.updateExperienceForUser(currentUser.getId(), experience);
    }

    // ✅ DELETE sécurisé
    @DeleteMapping("/user/me/{id}")
    public void deleteForCurrentUser(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        experienceService.deleteExperienceForUser(currentUser.getId(), id);
    }

    // ✅ TOTAL YEARS
    @GetMapping("/user/me/total-years")
    public double getTotalYearsForCurrentUser(
            @RequestHeader("Authorization") String authorization) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        return experienceService.calculateTotalYearsByUser(currentUser.getId());
    }
    // Ajoutez ce code
    @GetMapping("/user/me/{id}")
    public Experience getMyExperienceById(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Experience exp = experienceService.getExperienceById(id);

        // Sécurisation : retour uniquement si appartient à l'utilisateur
        if (exp == null || !exp.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Not found or unauthorized");
        }

        return exp;
    }
}