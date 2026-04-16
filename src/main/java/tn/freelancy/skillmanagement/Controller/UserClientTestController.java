package tn.freelancy.skillmanagement.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.freelancy.skillmanagement.clients.UserServiceClient;

import java.util.Map;

@RestController
@RequestMapping("/api/user-service")
public class UserClientTestController {

    private final UserServiceClient userServiceClient;

    public UserClientTestController(UserServiceClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }

    /**
     * Simple endpoint to test communication with the user microservice via Eureka + Feign.
     * 
     * In Swagger, call this endpoint with an Authorization header (e.g. "Bearer ...")
     * and it will internally call the remote /api/public/ping on smart-freelance-backend.
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> pingUserService(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {

        Map<String, String> response = userServiceClient.ping();
        return ResponseEntity.ok(response);
    }
}

