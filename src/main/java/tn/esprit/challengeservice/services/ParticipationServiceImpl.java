package tn.esprit.challengeservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.challengeservice.clients.UserDto;
import tn.esprit.challengeservice.clients.UserServiceClient;
import tn.esprit.challengeservice.entities.*;
import tn.esprit.challengeservice.exceptions.SonarResultsNotFoundException;
import tn.esprit.challengeservice.repositories.ChallengeRepository;
import tn.esprit.challengeservice.repositories.SonarCloudResultRepository;
import tn.esprit.challengeservice.repositories.participationRepository;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParticipationServiceImpl implements iparticipationService {

    private final participationRepository participationRepository;
    private final ChallengeRepository challengeRepository;
    private final GitHubService gitHubService;
    private final SonarCloudResultRepository sonarCloudResultRepository;
    private final UserServiceClient userServiceClient;

    @Override
    public ChallengeParticipation joinChallenge(String challengeId, String usernameGithub, String authorization) {
        UserDto currentUser = userServiceClient.getCurrentUser(authorization);

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found with id: " + challengeId));

        if (!ChallengeStatus.ACTIVE.equals(challenge.getStatus())) {
            throw new RuntimeException("Challenge is not active");
        }

        boolean alreadyJoined = participationRepository
                .existsByChallengeIdChallengeAndUserId(challengeId, currentUser.getId());
        if (alreadyJoined) {
            throw new RuntimeException("You have already joined this challenge");
        }

        String sanitizedTitle = challenge.getTitle()
                .replaceAll("[^a-zA-Z0-9-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        String repoName = sanitizedTitle + "-" + usernameGithub;

        String repoUrl = gitHubService.createRepository(repoName);
        gitHubService.addCollaborator(repoName, usernameGithub);
        gitHubService.addSonarTokenSecret(repoName);
        gitHubService.createSonarCloudProject(repoName);

        ChallengeParticipation participation = ChallengeParticipation.builder()
                .userId(currentUser.getId())
                .usernameGithub(usernameGithub)
                .repoUrl(repoUrl)
                .repoName(repoName)
                .forkCreatedAt(new Date())
                .status(ParticipationStatus.ACTIVE)
                .challenge(challenge)
                .build();

        return participationRepository.save(participation);
    }

    @Override
    public List<ChallengeParticipation> getAllParticipations() {
        return participationRepository.findAll();
    }

    @Override
    public ChallengeParticipation getParticipationById(String id) {
        return participationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Participation not found with id: " + id));
    }

    @Override
    public List<ChallengeParticipation> getParticipationsByChallenge(String challengeId) {
        return participationRepository.findByChallengeIdChallenge(challengeId);
    }

    @Override
    public void deleteParticipation(String id) {
        if (!participationRepository.existsById(id)) {
            throw new RuntimeException("Participation not found with id: " + id);
        }
        participationRepository.deleteById(id);
    }

    @Override
    public boolean checkInvitationStatus(String participationId) {
        ChallengeParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new RuntimeException("Participation not found with id: " + participationId));

        return gitHubService.isCollaboratorAccepted(participation.getRepoName(), participation.getUsernameGithub());
    }

    @Override
    public String submitChallenge(String participationId, String branchName) {
        ChallengeParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new RuntimeException("Participation not found with id: " + participationId));

        if (!ParticipationStatus.ACTIVE.equals(participation.getStatus())) {
            throw new RuntimeException("Participation is not active");
        }

        String prUrl = gitHubService.createPullRequest(participation.getRepoName(), branchName);

        participation.setStatus(ParticipationStatus.SUBMITTED);
        participationRepository.save(participation);

        return prUrl;
    }

    @Override
    public SonarCloudResult fetchSonarResults(String participationId) {
        ChallengeParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new RuntimeException("Participation not found with id: " + participationId));

        String prKey = gitHubService.getLatestPullRequestNumber(participation.getRepoName());
        Map<String, Object> metrics = gitHubService.fetchSonarCloudMetrics(participation.getRepoName(), prKey);

        SonarCloudResult result = sonarCloudResultRepository.findByParticipationId(participationId)
                .orElse(new SonarCloudResult());

        result.setQualityGateStatus(getStringMetric(metrics, "alert_status"));
        result.setBugs(getIntMetric(metrics, "bugs"));
        result.setCodeSmells(getIntMetric(metrics, "code_smells"));
        result.setVulnerabilities(getIntMetric(metrics, "vulnerabilities"));
        result.setSecurityHotspots(getIntMetric(metrics, "security_hotspots"));
        result.setCoverage(getDoubleMetric(metrics, "coverage"));
        result.setDuplication(getDoubleMetric(metrics, "duplicated_lines_density"));
        result.setLinesOfCode(getIntMetric(metrics, "ncloc"));
        result.setPullRequestKey(prKey);
        result.setAnalyzedAt(new Date());
        result.setParticipation(participation);

        return sonarCloudResultRepository.save(result);
    }

    @Override
    public SonarCloudResult getSonarResults(String participationId) {
        return sonarCloudResultRepository.findByParticipationId(participationId)
                .orElseThrow(() -> new SonarResultsNotFoundException("SonarCloud results not ready yet. Analysis may still be in progress."));
    }

    @Override
    public Optional<SonarCloudResult> getSonarResultsIfPresent(String participationId) {
        return sonarCloudResultRepository.findByParticipationId(participationId);
    }

    @Override
    public List<ChallengeParticipation> getMyParticipations(String authorization) {
        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        return participationRepository.findByUserId(currentUser.getId());
    }

    @Override
    public ChallengeParticipation getMyParticipationForChallenge(String challengeId, String authorization) {
        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        return participationRepository.findByChallengeIdChallengeAndUserId(challengeId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("You have not joined this challenge"));
    }

    @Override
    public long getTotalParticipantsCount() {
        return participationRepository.count();
    }

    @Override
    public SonarCloudResult updateSonarResults(String participationId, SonarCloudResult updatedResult) {
        SonarCloudResult existing = sonarCloudResultRepository.findByParticipationId(participationId)
                .orElseThrow(() -> new RuntimeException("SonarCloud results not found for participation: " + participationId));

        existing.setQualityGateStatus(updatedResult.getQualityGateStatus());
        existing.setBugs(updatedResult.getBugs());
        existing.setCodeSmells(updatedResult.getCodeSmells());
        existing.setVulnerabilities(updatedResult.getVulnerabilities());
        existing.setSecurityHotspots(updatedResult.getSecurityHotspots());
        existing.setCoverage(updatedResult.getCoverage());
        existing.setDuplication(updatedResult.getDuplication());
        existing.setLinesOfCode(updatedResult.getLinesOfCode());

        return sonarCloudResultRepository.save(existing);
    }

    @Override
    public void saveSonarPoints(String participationId, String sonarResultId, int pointsAwarded) {
        if (pointsAwarded < 0) {
            throw new IllegalArgumentException("pointsAwarded must be >= 0");
        }
        SonarCloudResult result = sonarCloudResultRepository.findById(sonarResultId)
                .orElseThrow(() -> new SonarResultsNotFoundException("SonarCloud result not found: " + sonarResultId));
        if (result.getParticipation() == null || !result.getParticipation().getId().equals(participationId)) {
            throw new SonarResultsNotFoundException("SonarCloud result does not belong to participation: " + participationId);
        }
        Challenge challenge = result.getParticipation().getChallenge();
        if (challenge != null && challenge.getPoints() != null && pointsAwarded > challenge.getPoints()) {
            throw new IllegalArgumentException("pointsAwarded cannot exceed challenge max points (" + challenge.getPoints() + ")");
        }
        result.setPointsAwarded(pointsAwarded);
        sonarCloudResultRepository.save(result);
    }

    private String getStringMetric(Map<String, Object> metrics, String key) {
        Object value = metrics.get(key);
        return value != null ? value.toString() : null;
    }

    private int getIntMetric(Map<String, Object> metrics, String key) {
        Object value = metrics.get(key);
        return value != null ? Integer.parseInt(value.toString()) : 0;
    }

    private double getDoubleMetric(Map<String, Object> metrics, String key) {
        Object value = metrics.get(key);
        return value != null ? Double.parseDouble(value.toString()) : 0.0;
    }
}
