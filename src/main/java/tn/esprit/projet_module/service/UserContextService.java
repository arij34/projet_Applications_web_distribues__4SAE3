package tn.esprit.projet_module.service;

import org.springframework.stereotype.Service;
import tn.esprit.projet_module.clients.UserDto;
import tn.esprit.projet_module.clients.UserServiceClient;

@Service
public class UserContextService {

    private final UserServiceClient userServiceClient;

    public UserContextService(UserServiceClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }

    /**
     * Resolves the current user from the user service using the Bearer token.
     * The user service validates the Keycloak JWT and returns the user profile.
     *
     * @param authHeader "Bearer &lt;token&gt;" or null
     * @return UserDto if token is valid and user exists, null otherwise
     */
    public UserDto resolveCurrentUser(String authHeader) {
        if (authHeader == null || authHeader.isBlank() || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            return userServiceClient.getCurrentUser(authHeader);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Ensures the auth header includes "Bearer " prefix for Feign calls.
     */
    public String ensureBearer(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) return null;
        return authHeader.startsWith("Bearer ") ? authHeader : "Bearer " + authHeader;
    }
}
