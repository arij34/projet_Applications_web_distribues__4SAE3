package tn.esprit.projet_module.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.Map;

@FeignClient(name = "smart-freelance-backend")
public interface UserServiceClient {

    @GetMapping("/api/public/ping")
    Map<String, String> ping();

    @GetMapping("/api/me")
    UserDto getCurrentUser(@RequestHeader("Authorization") String bearerToken);

    @GetMapping("/api/admin/users")
    List<Map<String, Object>> getAllUsers(@RequestHeader("Authorization") String bearerToken);

    @GetMapping("/api/users/{id}")
    Map<String, Object> getUserById(@PathVariable("id") Long id, @RequestHeader("Authorization") String bearerToken);
}
