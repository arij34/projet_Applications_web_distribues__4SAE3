package tn.esprit.challengeservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.challengeservice.entities.Challenge;
import tn.esprit.challengeservice.entities.ChallengeStatus;

public interface ChallengeRepository extends JpaRepository<Challenge, String> {

    long countByStatus(ChallengeStatus status);
}
