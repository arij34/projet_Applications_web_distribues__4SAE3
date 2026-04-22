package tn.esprit.projet_module.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class FreelancerInfoService {

    @Value("${keycloak.admin.url:http://localhost:8081}")
    private String keycloakUrl;

    @Value("${keycloak.admin.realm:smart-platform}")
    private String realm;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Récupère un token admin Keycloak ──
    private String getAdminToken() {
        String url = keycloakUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "grant_type=password&client_id=admin-cli"
                + "&username=" + adminUsername
                + "&password=" + adminPassword;

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        Map responseBody = response.getBody();
        if (responseBody == null || responseBody.get("access_token") == null) {
            throw new RuntimeException("Cannot get Keycloak admin token");
        }
        return responseBody.get("access_token").toString();
    }

    // ── Récupère email + nom depuis Keycloak par keycloakId (sub) ──
    public Map<String, String> getFreelancerInfo(String keycloakId) {
        try {
            String token = getAdminToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);

            String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakId;

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class
            );

            Map body = response.getBody();
            if (body == null) return Map.of();

            String email     = body.getOrDefault("email",     "").toString();
            String firstName = body.getOrDefault("firstName", "").toString();
            String lastName  = body.getOrDefault("lastName",  "").toString();
            String fullName  = (firstName + " " + lastName).trim();
            if (fullName.isBlank()) fullName = "Freelancer";

            return Map.of(
                    "email",    email,
                    "fullName", fullName
            );

        } catch (Exception e) {
            System.err.println("⚠️ Cannot fetch freelancer info from Keycloak: " + e.getMessage());
            return Map.of();
        }
    }
}