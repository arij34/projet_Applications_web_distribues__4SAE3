package tn.esprit.challengeservice.services;

import tn.esprit.challengeservice.entities.Challenge;

import java.util.List;
import java.util.Map;

public interface ichallengeService {
    Challenge addChallenge(Challenge challenge);
    List<Challenge> getAllChallenges();
    Challenge getChallengeById(String id);
    Challenge updateChallenge(String id, Challenge challenge);
    void deleteChallenge(String id);
    long countActiveChallenges();
    long countCompletedChallenges();
    Map<String, Long> getTechnologyCounts();
    Map<String, Long> getCategoryCounts();
}
