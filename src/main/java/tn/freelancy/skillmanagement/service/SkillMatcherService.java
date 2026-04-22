package tn.freelancy.skillmanagement.service;

import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.dto.SkillMatchResult;
import tn.freelancy.skillmanagement.entity.Skill;
import tn.freelancy.skillmanagement.repository.SkillRepository;

import java.util.List;

@Service
public class SkillMatcherService {

    private final SkillRepository skillRepository;
    private final SimilarityService similarityService;

    private static final double GOOD_MATCH_THRESHOLD = 0.70;
    private static final double SUGGESTION_MIN_THRESHOLD = 0.30;

    public SkillMatcherService(SkillRepository skillRepository,
                               SimilarityService similarityService) {
        this.skillRepository = skillRepository;
        this.similarityService = similarityService;
    }

    // 🔹 FLEXIBLE → formulaire (Did you mean)
    public SkillMatchResult findMatchOrSuggest(String input) {

        if (input == null || input.trim().isEmpty()) {
            return new SkillMatchResult(null, 0, false, false);
        }

        input = input.toLowerCase().trim();
        List<Skill> skills = skillRepository.findAll();

        Skill bestMatch = null;
        double bestScore = 0;

        for (Skill skill : skills) {

            String skillName = skill.getName().toLowerCase();
            double score = similarityService.calculateSimilarity(input, skillName);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = skill;
            }
        }

        if (bestMatch == null) {
            return new SkillMatchResult(null, 0, false, false);
        }

        if (bestScore >= GOOD_MATCH_THRESHOLD) {
            return new SkillMatchResult(bestMatch, bestScore, true, false);
        }

        if (bestScore >= SUGGESTION_MIN_THRESHOLD) {
            return new SkillMatchResult(bestMatch, bestScore, false, true);
        }

        return new SkillMatchResult(null, bestScore, false, false);
    }

    // 🔹 STRICT → dashboard (doublons)
    public Skill findMatchingSkill(String input) {

        if (input == null || input.trim().isEmpty()) return null;

        input = input.toLowerCase().trim();
        List<Skill> skills = skillRepository.findAll();

        for (Skill skill : skills) {
            String skillName = skill.getName().toLowerCase();
            double score = similarityService.calculateSimilarity(input, skillName);

            if (score >= 0.85) {
                return skill;
            }
        }

        return null;
    }
}