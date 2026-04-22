package tn.esprit.challengeservice.services;

import tn.esprit.challengeservice.entities.ChallengeParticipation;
import tn.esprit.challengeservice.entities.SonarCloudResult;

import java.util.List;
import java.util.Optional;

public interface iparticipationService {
    ChallengeParticipation joinChallenge(String challengeId, String usernameGithub, String authorization);
    List<ChallengeParticipation> getAllParticipations();
    ChallengeParticipation getParticipationById(String id);
    List<ChallengeParticipation> getParticipationsByChallenge(String challengeId);
    void deleteParticipation(String id);
    boolean checkInvitationStatus(String participationId);
    String submitChallenge(String participationId, String branchName);
    SonarCloudResult fetchSonarResults(String participationId);
    SonarCloudResult getSonarResults(String participationId);

    Optional<SonarCloudResult> getSonarResultsIfPresent(String participationId);
    SonarCloudResult updateSonarResults(String participationId, SonarCloudResult updatedResult);

    void saveSonarPoints(String participationId, String sonarResultId, int pointsAwarded);
    List<ChallengeParticipation> getMyParticipations(String authorization);
    ChallengeParticipation getMyParticipationForChallenge(String challengeId, String authorization);
    long getTotalParticipantsCount();
}
