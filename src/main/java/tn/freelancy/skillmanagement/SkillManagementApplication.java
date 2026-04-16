package tn.freelancy.skillmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableDiscoveryClient
@EnableFeignClients(basePackages = "tn.freelancy.skillmanagement.clients")
@SpringBootApplication
public class SkillManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillManagementApplication.class, args);
    }

}
