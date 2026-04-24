package tn.esprit.challengeservice.services;

import com.goterl.lazysodium.SodiumJava;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
public class GitHubService {

    private static final String TEMPLATE_URL =
            "https://api.github.com/repos/challenge-org-Freelancy/challenge-Test/generate";
    private static final String ORG_OWNER = "challenge-org-Freelancy";
    private static final String SONAR_ORG = "challenge-org-freelancy";
    private static final int SEAL_BYTES = 48;

    @Value("${github.token}")
    private String githubToken;

    @Value("${sonar.token}")
    private String sonarToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public String createRepository(String repoName) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "owner", ORG_OWNER,
                "name", repoName,
                "private", true
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                TEMPLATE_URL,
                HttpMethod.POST,
                request,
                Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String htmlUrl = (String) response.getBody().get("html_url");
            log.info("GitHub repository created successfully: {}", htmlUrl);
            return htmlUrl;
        }

        throw new RuntimeException("Failed to create GitHub repository: " + response.getStatusCode());
    }

    public void addCollaborator(String repoName, String usernameGithub) {
        String url = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName + "/collaborators/" + usernameGithub;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("permission", "push");

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    request,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Collaborator {} added to repo {}", usernameGithub, repoName);
            } else {
                throw new RuntimeException("Failed to add collaborator: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new RuntimeException(
                    "GitHub collaborator invite failed (404). Verify repo '" + repoName + "' exists under org '"
                            + ORG_OWNER + "' and user '" + usernameGithub + "' exists.",
                    e
            );
        }
    }

    /**
     * Checks if a branch exists in a GitHub repository.
     * @param repoUrl Full repo URL (e.g. https://github.com/challenge-org-Freelancy/repo-name or .../repo-name.git)
     * @param branchName Branch name to check
     * @return true if branch exists, false otherwise
     */
    public boolean doesBranchExist(String repoUrl, String branchName) {
        if (repoUrl == null || repoUrl.isBlank() || branchName == null || branchName.isBlank()) {
            return false;
        }
        String ownerRepo = extractOwnerRepoFromUrl(repoUrl);
        if (ownerRepo == null) {
            return false;
        }
        String url = "https://api.github.com/repos/" + ownerRepo + "/branches/" + branchName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        }
    }

    private String extractOwnerRepoFromUrl(String repoUrl) {
        try {
            String normalized = repoUrl.trim().replace(".git", "");
            if (normalized.contains("github.com/")) {
                String path = normalized.substring(normalized.indexOf("github.com/") + 11);
                if (path.endsWith("/")) {
                    path = path.substring(0, path.length() - 1);
                }
                return path;
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to extract owner/repo from url: {}", repoUrl);
            return null;
        }
    }

    public boolean doesUserExist(String usernameGithub) {
        String url = "https://api.github.com/users/" + usernameGithub;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/vnd.github+json");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.GET, request, Void.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        }
    }

    public boolean isCollaboratorAccepted(String repoName, String usernameGithub) {
        String url = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName + "/collaborators/" + usernameGithub;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    request,
                    Void.class
            );
            return response.getStatusCode().value() == 204;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        }
    }

    public void createSonarCloudProject(String repoName) {
        if (sonarToken == null || sonarToken.isEmpty()) {
            log.warn("SONAR_TOKEN not configured, skipping SonarCloud project creation for repo: {}", repoName);
            return;
        }

        String projectKey = ORG_OWNER + "_" + repoName;
        String url = "https://sonarcloud.io/api/projects/create"
                + "?name=" + repoName
                + "&organization=" + SONAR_ORG
                + "&project=" + projectKey;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + sonarToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("SonarCloud project created: {}", projectKey);
            }
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 400 && e.getResponseBodyAsString().contains("already exists")) {
                log.info("SonarCloud project already exists: {}", projectKey);
            } else {
                log.error("Failed to create SonarCloud project: {}", e.getMessage());
                throw new RuntimeException("Failed to create SonarCloud project: " + e.getMessage());
            }
        }
    }

    public String createPullRequest(String repoName, String branchName) {
        String url = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName + "/pulls";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");
        headers.setContentType(MediaType.APPLICATION_JSON);

        String baseBranch = getDefaultBranch(repoName);

        Map<String, Object> body = Map.of(
                "title", "Challenge Submission",
                "head", branchName,
                "base", baseBranch,
                "body", "Automated challenge submission from branch " + branchName
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            if (githubToken == null || githubToken.isBlank()) {
                throw new RuntimeException("GitHub token is not configured. Set GITHUB_TOKEN environment variable.");
            }
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String prUrl = (String) response.getBody().get("html_url");
                log.info("Pull request created for repo {}: {}", repoName, prUrl);
                return prUrl;
            }
            throw new RuntimeException("Failed to create pull request: " + response.getStatusCode());
        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            int status = e.getStatusCode().value();
            if (status == 401) {
                throw new RuntimeException("Invalid or missing GitHub token. Check GITHUB_TOKEN is set correctly.");
            }
            if (status == 404) {
                throw new RuntimeException("Repository or branch not found. Ensure the branch '" + branchName + "' exists and is pushed.");
            }
            if (status == 422) {
                log.warn("GitHub 422 creating PR for repo {} branch {}: {}", repoName, branchName, errorBody);
                if (errorBody != null && errorBody.contains("A pull request already exists")) {
                    throw new RuntimeException("A pull request already exists for branch '" + branchName + "'. Check GitHub.");
                }
                if (errorBody != null && errorBody.contains("Reference does not exist")) {
                    throw new RuntimeException("Branch '" + branchName + "' not found. Ensure it exists and is pushed to the remote.");
                }
                throw new RuntimeException("Cannot create pull request: " + (errorBody != null && errorBody.length() < 200 ? errorBody : "Validation failed. Check branch name and that it is pushed."));
            }
            throw new RuntimeException("Failed to create pull request: " + (errorBody != null && !errorBody.isBlank() ? errorBody : e.getMessage()));
        }
    }

    private String getDefaultBranch(String repoName) {
        String url = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String defaultBranch = (String) response.getBody().get("default_branch");
                return defaultBranch != null && !defaultBranch.isBlank() ? defaultBranch : "main";
            }
        } catch (Exception e) {
            log.warn("Could not fetch default branch for repo {}, using main: {}", repoName, e.getMessage());
        }
        return "main";
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchSonarCloudMetrics(String repoName, String pullRequestKey) {
        String projectKey = ORG_OWNER + "_" + repoName;
        String url = "https://sonarcloud.io/api/measures/component"
                + "?component=" + projectKey
                + "&pullRequest=" + pullRequestKey
                + "&metricKeys=bugs,code_smells,vulnerabilities,security_hotspots,coverage,duplicated_lines_density,ncloc,alert_status";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + sonarToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Failed to fetch SonarCloud metrics for: " + projectKey);
        }

        Map<String, Object> component = (Map<String, Object>) response.getBody().get("component");
        List<Map<String, String>> measures = (List<Map<String, String>>) component.get("measures");

        Map<String, Object> result = new HashMap<>();
        for (Map<String, String> measure : measures) {
            result.put(measure.get("metric"), measure.get("value"));
        }

        log.info("Fetched SonarCloud metrics for project {}, PR {}: {}", projectKey, pullRequestKey, result);
        return result;
    }

    /**
     * Fetches SonarCloud metrics for a GitHub pull request URL.
     * Example: https://github.com/challenge-org-Freelancy/AI-Task-Manager-with-Smart-Suggestions-Ameny323/pull/1
     */
    public Map<String, Object> fetchSonarCloudMetricsByPrUrl(String prUrl) {
        var parsed = parsePrUrl(prUrl);
        if (parsed == null) {
            throw new IllegalArgumentException("Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/number");
        }
        String repoName = parsed.get("repoName");
        String pullNumber = parsed.get("pullNumber");
        return fetchSonarCloudMetrics(repoName, pullNumber);
    }

    private Map<String, String> parsePrUrl(String prUrl) {
        if (prUrl == null || !prUrl.contains("github.com/")) {
            return null;
        }
        try {
            String path = prUrl.trim().replace(".git", "");
            int idx = path.indexOf("github.com/");
            if (idx < 0) return null;
            path = path.substring(idx + 11);
            if (path.endsWith("/")) path = path.substring(0, path.length() - 1);
            String[] parts = path.split("/");
            if (parts.length >= 4 && "pull".equalsIgnoreCase(parts[2])) {
                String repoName = parts[1];
                String pullNumber = parts[3];
                return Map.of("repoName", repoName, "pullNumber", pullNumber);
            }
        } catch (Exception e) {
            log.warn("Failed to parse PR URL: {}", prUrl);
        }
        return null;
    }

    public String getLatestPullRequestNumber(String repoName) {
        String url = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName + "/pulls?state=all&sort=created&direction=desc&per_page=1";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, request, List.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && !response.getBody().isEmpty()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> pr = (Map<String, Object>) response.getBody().get(0);
            return String.valueOf(pr.get("number"));
        }

        throw new RuntimeException("No pull requests found for repo: " + repoName);
    }

    public void addSonarTokenSecret(String repoName) {
        if (sonarToken == null || sonarToken.isEmpty()) {
            log.warn("SONAR_TOKEN not configured, skipping secret creation for repo: {}", repoName);
            return;
        }
        addRepoSecret(repoName, "SONAR_TOKEN", sonarToken);
    }

    private void addRepoSecret(String repoName, String secretName, String secretValue) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github+json");
        headers.setContentType(MediaType.APPLICATION_JSON);

        String keyUrl = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName + "/actions/secrets/public-key";
        HttpEntity<Void> keyRequest = new HttpEntity<>(headers);
        ResponseEntity<Map> keyResponse = restTemplate.exchange(keyUrl, HttpMethod.GET, keyRequest, Map.class);

        if (!keyResponse.getStatusCode().is2xxSuccessful() || keyResponse.getBody() == null) {
            throw new RuntimeException("Failed to get repo public key for: " + repoName);
        }

        String publicKeyBase64 = (String) keyResponse.getBody().get("key");
        String keyId = (String) keyResponse.getBody().get("key_id");

        byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
        byte[] messageBytes = secretValue.getBytes(StandardCharsets.UTF_8);
        byte[] cipherText = new byte[SEAL_BYTES + messageBytes.length];

        SodiumJava sodium = new SodiumJava();
        int result = sodium.crypto_box_seal(cipherText, messageBytes, messageBytes.length, publicKeyBytes);
        if (result != 0) {
            throw new RuntimeException("Failed to encrypt secret value");
        }

        String encryptedValue = Base64.getEncoder().encodeToString(cipherText);

        String secretUrl = "https://api.github.com/repos/" + ORG_OWNER + "/" + repoName + "/actions/secrets/" + secretName;
        Map<String, String> body = Map.of(
                "encrypted_value", encryptedValue,
                "key_id", keyId
        );
        HttpEntity<Map<String, String>> secretRequest = new HttpEntity<>(body, headers);
        ResponseEntity<Void> response = restTemplate.exchange(secretUrl, HttpMethod.PUT, secretRequest, Void.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            log.info("Secret {} added to repo {}", secretName, repoName);
        } else {
            throw new RuntimeException("Failed to add secret to repo: " + response.getStatusCode());
        }
    }
}
