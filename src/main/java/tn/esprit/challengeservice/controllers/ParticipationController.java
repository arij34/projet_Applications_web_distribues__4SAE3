package tn.esprit.challengeservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.challengeservice.dtos.SaveSonarPointsRequest;
import tn.esprit.challengeservice.entities.ChallengeParticipation;
import tn.esprit.challengeservice.entities.SonarCloudResult;
import tn.esprit.challengeservice.exceptions.SonarResultsNotFoundException;
import tn.esprit.challengeservice.services.GitHubService;
import tn.esprit.challengeservice.services.iparticipationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/participations")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ParticipationController {

    private final iparticipationService participationService;
    private final GitHubService gitHubService;

    @PostMapping("/{challengeId}/join")
    public ChallengeParticipation joinChallenge(
            @PathVariable String challengeId,
            @RequestParam String usernameGithub,
            @RequestHeader("Authorization") String authorization) {
        return participationService.joinChallenge(challengeId, usernameGithub, authorization);
    }

    @GetMapping("/my/challenges")
    public List<ChallengeParticipation> getMyParticipations(@RequestHeader("Authorization") String authorization) {
        return participationService.getMyParticipations(authorization);
    }

    @GetMapping("/my/challenge/{challengeId}")
    public ChallengeParticipation getMyParticipationForChallenge(
            @PathVariable String challengeId,
            @RequestHeader("Authorization") String authorization) {
        return participationService.getMyParticipationForChallenge(challengeId, authorization);
    }

    @GetMapping
    public List<ChallengeParticipation> getAllParticipations() {
        return participationService.getAllParticipations();
    }

    @GetMapping("/count")
    public Map<String, Long> getTotalParticipantsCount() {
        return Map.of("count", participationService.getTotalParticipantsCount());
    }

    @GetMapping("/{id}")
    public ChallengeParticipation getParticipationById(@PathVariable String id) {
        return participationService.getParticipationById(id);
    }

    @GetMapping("/challenge/{challengeId}")
    public List<ChallengeParticipation> getParticipationsByChallenge(@PathVariable String challengeId) {
        return participationService.getParticipationsByChallenge(challengeId);
    }

    @DeleteMapping("/{id}")
    public void deleteParticipation(@PathVariable String id) {
        participationService.deleteParticipation(id);
    }

    @GetMapping("/{id}/invitation-status")
    public Map<String, Object> checkInvitationStatus(@PathVariable String id) {
        boolean accepted = participationService.checkInvitationStatus(id);
        return Map.of(
                "participationId", id,
                "accepted", accepted,
                "message", accepted ? "Invitation accepted" : "Invitation still pending"
        );
    }

    @PostMapping("/{participationId}/submit")
    public Map<String, Object> submitChallenge(
            @PathVariable String participationId,
            @RequestParam String branchName) {
        String prUrl = participationService.submitChallenge(participationId, branchName);
        return Map.of(
                "participationId", participationId,
                "pullRequestUrl", prUrl,
                "message", "Challenge submitted successfully. SonarCloud analysis will run automatically."
        );
    }

    /**
     * Fetch SonarCloud results by GitHub PR URL. For Swagger testing.
     * Example: GET /participations/sonar-results/fetch-by-url?prUrl=https://github.com/challenge-org-Freelancy/AI-Task-Manager-with-Smart-Suggestions-Ameny323/pull/1
     */
    @GetMapping("/sonar-results/fetch-by-url")
    public Map<String, Object> fetchSonarResultsByPrUrl(@RequestParam String prUrl) {
        Map<String, Object> metrics = gitHubService.fetchSonarCloudMetricsByPrUrl(prUrl);
        return Map.of(
                "pullRequestUrl", prUrl,
                "qualityGateStatus", parseString(metrics, "alert_status"),
                "bugs", parseInt(metrics, "bugs"),
                "codeSmells", parseInt(metrics, "code_smells"),
                "vulnerabilities", parseInt(metrics, "vulnerabilities"),
                "securityHotspots", parseInt(metrics, "security_hotspots"),
                "coverage", parseDouble(metrics, "coverage"),
                "duplication", parseDouble(metrics, "duplicated_lines_density"),
                "linesOfCode", parseInt(metrics, "ncloc"),
                "rawMetrics", metrics
        );
    }

    private static String parseString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : "";
    }

    private static int parseInt(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? Integer.parseInt(v.toString()) : 0;
    }

    private static double parseDouble(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? Double.parseDouble(v.toString()) : 0.0;
    }

    @GetMapping("/{participationId}/sonar-results")
    public SonarCloudResult getSonarResults(@PathVariable String participationId) {
        try {
            return participationService.getSonarResults(participationId);
        } catch (SonarResultsNotFoundException e) {
            // Try to fetch from SonarCloud (analysis may have just finished)
            try {
                return participationService.fetchSonarResults(participationId);
            } catch (Exception ex) {
                throw e;
            }
        }
    }

    @GetMapping("/{participationId}/sonar-results/status")
    public Map<String, Object> getSonarResultsStatus(@PathVariable String participationId) {
        var resultOpt = participationService.getSonarResultsIfPresent(participationId);
        return resultOpt
                .map(result -> Map.<String, Object>of(
                        "status", "completed",
                        "result", result))
                .orElse(Map.of("status", "pending", "result", (Object) null));
    }

    @PostMapping("/{participationId}/sonar-results/refresh")
    public SonarCloudResult refreshSonarResults(@PathVariable String participationId) {
        return participationService.fetchSonarResults(participationId);
    }

    @PutMapping("/{participationId}/sonar-results")
    public SonarCloudResult updateSonarResults(@PathVariable String participationId,
                                               @RequestBody SonarCloudResult updatedResult) {
        return participationService.updateSonarResults(participationId, updatedResult);
    }

    @PatchMapping("/{participationId}/sonar-results/{sonarResultId}/points")
    public void saveSonarPoints(@PathVariable String participationId,
                                @PathVariable String sonarResultId,
                                @RequestBody SaveSonarPointsRequest body) {
        Integer points = body != null ? body.getPointsAwarded() : null;
        if (points == null) {
            throw new IllegalArgumentException("pointsAwarded is required");
        }
        participationService.saveSonarPoints(participationId, sonarResultId, points);
    }

    @GetMapping("/github/user-exists/{usernameGithub}")
    public Map<String, Object> checkGitHubUserExists(@PathVariable String usernameGithub) {
        boolean exists = gitHubService.doesUserExist(usernameGithub);
        return Map.of(
                "usernameGithub", usernameGithub,
                "exists", exists
        );
    }

    @GetMapping("/github/branch-exists")
    public Map<String, Object> checkBranchExists(
            @RequestParam String repoUrl,
            @RequestParam String branchName) {
        boolean exists = gitHubService.doesBranchExist(repoUrl, branchName);
        return Map.of(
                "repoUrl", repoUrl,
                "branchName", branchName,
                "exists", exists
        );
    }
}
