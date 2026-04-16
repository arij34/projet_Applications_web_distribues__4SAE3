package tn.esprit.evenment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EvenmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(EvenmentApplication.class, args);
    }

}
