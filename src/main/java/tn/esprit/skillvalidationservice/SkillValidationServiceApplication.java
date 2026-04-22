package tn.esprit.skillvalidationservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class SkillValidationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillValidationServiceApplication.class, args);
    }

}
