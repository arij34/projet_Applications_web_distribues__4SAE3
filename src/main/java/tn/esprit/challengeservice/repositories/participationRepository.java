package tn.esprit.challengeservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.challengeservice.entities.ChallengeParticipation;
import tn.esprit.challengeservice.entities.ParticipationStatus;

import java.util.List;
import java.util.Optional;

public interface participationRepository extends JpaRepository<ChallengeParticipation, String> {

    boolean existsByChallengeIdChallengeAndUsernameGithub(String challengeId, String usernameGithub);

    boolean existsByChallengeIdChallengeAndUserId(String challengeId, Long userId);

    List<ChallengeParticipation> findByChallengeIdChallenge(String challengeId);

    List<ChallengeParticipation> findByUserId(Long userId);

    Optional<ChallengeParticipation> findByChallengeIdChallengeAndUserId(String challengeId, Long userId);

    List<ChallengeParticipation> findByStatus(ParticipationStatus status);
}
