package tn.esprit.challengeservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.challengeservice.entities.*;
import tn.esprit.challengeservice.repositories.ChallengeRepository;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChallengeServiceImpl implements ichallengeService {

    private final ChallengeRepository challengeRepository;

    @Override
    public Challenge addChallenge(Challenge challenge) {
        if (challenge.getTasks() != null) {
            challenge.getTasks().forEach(task -> task.setChallenge(challenge));
        }
        return challengeRepository.save(challenge);
    }

    @Override
    public Challenge getChallengeById(String id) {
        return challengeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Challenge not found with id: " + id));
    }

    @Override
    public List<Challenge> getAllChallenges() {
        return challengeRepository.findAll();
    }

    @Override
    public Challenge updateChallenge(String id, Challenge challenge) {
        Challenge existingChallenge = challengeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Challenge not found with id: " + id));
        existingChallenge.setTitle(challenge.getTitle());
        existingChallenge.setCategory(challenge.getCategory());
        existingChallenge.setTechnology(challenge.getTechnology());
        existingChallenge.setDifficulty(challenge.getDifficulty());
        existingChallenge.setDescription(challenge.getDescription());
        existingChallenge.setPoints(challenge.getPoints());
        existingChallenge.setMaxParticipants(challenge.getMaxParticipants());
        existingChallenge.setGithubUrl(challenge.getGithubUrl());
        existingChallenge.setImage(challenge.getImage());
        existingChallenge.setStartDate(challenge.getStartDate());
        existingChallenge.setEndDate(challenge.getEndDate());
        existingChallenge.setStatus(challenge.getStatus());
        return challengeRepository.save(existingChallenge);
    }

    @Override
    public void deleteChallenge(String id) {
        if (!challengeRepository.existsById(id)) {
            throw new RuntimeException("Challenge not found with id: " + id);
        }
        challengeRepository.deleteById(id);
    }

    @Override
    public long countActiveChallenges() {
        return challengeRepository.countByStatus(ChallengeStatus.ACTIVE);
    }

    @Override
    public long countCompletedChallenges() {
        return challengeRepository.countByStatus(ChallengeStatus.COMPLETED);
    }

    @Override
    public Map<String, Long> getTechnologyCounts() {
        List<String> knownTechs = Arrays.asList(
            "React", "TypeScript", "Node.js", "Python", "Go", "Rust",
            "Docker", "Kubernetes", "GraphQL", "PostgreSQL"
        );
        Map<String, Long> counts = knownTechs.stream()
            .collect(Collectors.toMap(t -> t, t -> 0L, (a, b) -> a, LinkedHashMap::new));

        List<Challenge> challenges = challengeRepository.findAll();
        for (Challenge c : challenges) {
            String tech = c.getTechnology();
            if (tech == null || tech.isBlank()) continue;
            for (String t : tech.split(",")) {
                String trimmed = t.trim();
                if (!trimmed.isEmpty()) {
                    counts.merge(trimmed, 1L, Long::sum);
                }
            }
        }
        return counts;
    }

    @Override
    public Map<String, Long> getCategoryCounts() {
        List<String> knownCategories = Arrays.asList(
            "Web Development", "Mobile Development", "Machine Learning",
            "DevOps", "Data Science", "Blockchain"
        );
        Map<String, Long> counts = knownCategories.stream()
            .collect(Collectors.toMap(c -> c, c -> 0L, (a, b) -> a, LinkedHashMap::new));

        List<Challenge> challenges = challengeRepository.findAll();
        for (Challenge c : challenges) {
            String category = c.getCategory();
            if (category != null && !category.isBlank()) {
                counts.merge(category.trim(), 1L, Long::sum);
            }
        }
        return counts;
    }
}
