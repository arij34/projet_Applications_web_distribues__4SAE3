package tn.esprit.challengeservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.challengeservice.entities.Task;

import java.util.List;

public interface TaskRepository  extends JpaRepository<Task, String> {
    List<Task> findByChallengeIdChallenge(String challengeId);

}
