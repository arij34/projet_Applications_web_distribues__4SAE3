package tn.esprit.challengeservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableDiscoveryClient
@EnableScheduling
@EnableFeignClients
@SpringBootApplication
public class ChallengeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChallengeServiceApplication.class, args);
    }

}
