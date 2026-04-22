package tn.esprit.challengeservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.esprit.challengeservice.entities.ChallengeParticipation;
import tn.esprit.challengeservice.entities.ParticipationStatus;
import tn.esprit.challengeservice.entities.SonarCloudResult;
import tn.esprit.challengeservice.repositories.participationRepository;
import tn.esprit.challengeservice.repositories.SonarCloudResultRepository;

import java.util.List;

/**
 * Scheduler that checks the SonarCloud pipeline status every 10 seconds.
 * For participations with status SUBMITTED that don't have SonarCloud results yet,
 * it attempts to fetch metrics from SonarCloud. When the analysis is ready, it saves
 * the results and logs that the pipeline has finished.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PipelineStatusScheduler {

    private final participationRepository participationRepository;
    private final SonarCloudResultRepository sonarCloudResultRepository;
    private final GitHubService gitHubService;

    @Scheduled(fixedRate = 10_000) // every 10 seconds
    public void checkSonarCloudPipelineStatus() {
        List<ChallengeParticipation> submitted = participationRepository.findByStatus(ParticipationStatus.SUBMITTED);
        if (submitted.isEmpty()) {
            return;
        }

        for (ChallengeParticipation participation : submitted) {
            // Skip if we already have SonarCloud results for this participation
            if (sonarCloudResultRepository.findByParticipationId(participation.getId()).isPresent()) {
                continue;
            }

            try {
                String prKey = gitHubService.getLatestPullRequestNumber(participation.getRepoName());
                var metrics = gitHubService.fetchSonarCloudMetrics(participation.getRepoName(), prKey);

                SonarCloudResult result = sonarCloudResultRepository.findByParticipationId(participation.getId())
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
                result.setAnalyzedAt(new java.util.Date());
                result.setParticipation(participation);

                sonarCloudResultRepository.save(result);
                log.info("SonarCloud pipeline finished for participation {} (repo: {}, PR: {})",
                        participation.getId(), participation.getRepoName(), prKey);
            } catch (Exception e) {
                // Analysis not ready yet or other transient error - will retry next run
                log.debug("SonarCloud analysis not ready for participation {} (repo: {}): {}",
                        participation.getId(), participation.getRepoName(), e.getMessage());
            }
        }
    }

    private String getStringMetric(java.util.Map<String, Object> metrics, String key) {
        Object value = metrics.get(key);
        return value != null ? value.toString() : null;
    }

    private int getIntMetric(java.util.Map<String, Object> metrics, String key) {
        Object value = metrics.get(key);
        return value != null ? Integer.parseInt(value.toString()) : 0;
    }

    private double getDoubleMetric(java.util.Map<String, Object> metrics, String key) {
        Object value = metrics.get(key);
        return value != null ? Double.parseDouble(value.toString()) : 0.0;
    }
}
