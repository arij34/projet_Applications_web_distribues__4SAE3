package tn.esprit.challengeservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.challengeservice.clients.UserDto;
import tn.esprit.challengeservice.clients.UserServiceClient;

import java.util.Map;

/**
 * Temporary controller to test inter-service communication with the user service.
 * DELETE THIS after confirming it works.
 */
@RestController
@RequestMapping("/test-user-service")
@RequiredArgsConstructor
public class UserTestController {

    private final UserServiceClient userServiceClient;

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> pingUserService() {
        Map<String, String> result = userServiceClient.ping();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@RequestHeader("Authorization") String authorization) {
        UserDto user = userServiceClient.getCurrentUser(authorization);
        return ResponseEntity.ok(user);
    }
}
