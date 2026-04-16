package tn.freelancy.skillmanagement.service;

import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.dto.SkillMatchResult;
import tn.freelancy.skillmanagement.entity.*;
import tn.freelancy.skillmanagement.repository.PendingSkillRepository;
import tn.freelancy.skillmanagement.repository.SkillRepository;

import java.util.*;

@Service
public class SkillMatcherService {

    private final SkillRepository skillRepository;
    private final PendingSkillRepository pendingSkillRepository;
    private final SimilarityService similarityService;

    public SkillMatcherService(SkillRepository skillRepository,
                               PendingSkillRepository pendingSkillRepository,
                               SimilarityService similarityService) {
        this.skillRepository = skillRepository;
        this.pendingSkillRepository = pendingSkillRepository;
        this.similarityService = similarityService;
    }

    // ════════════════════════════════════════════════════════════
    // SEUILS
    // ════════════════════════════════════════════════════════════
    private static final double EXACT_MATCH_THRESHOLD = 0.95;
    private static final double GOOD_MATCH_THRESHOLD = 0.80;
    private static final double SUGGESTION_MIN_THRESHOLD = 0.45;

    // ════════════════════════════════════════════════════════════
    // ALIASES
    // ════════════════════════════════════════════════════════════
    private static final Map<String, String> ALIASES = new HashMap<>();

    static {
        putAlias("js", "javascript");
        putAlias("javascript", "javascript");
        putAlias("ts", "typescript");
        putAlias("typescript", "typescript");
        putAlias("python", "python");
        putAlias("py", "python");
        putAlias("java", "java");
        putAlias("jdk", "java");
        putAlias("spring", "springboot");
        putAlias("springboot", "springboot");
        putAlias("spring boot", "springboot");
        putAlias("node", "nodejs");
        putAlias("nodejs", "nodejs");
        putAlias("react", "react");
        putAlias("reactjs", "react");
        putAlias("vue", "vuejs");
        putAlias("vuejs", "vuejs");
        putAlias("angular", "angular");
        putAlias("angularjs", "angular");
        putAlias("mysql", "mysql");
        putAlias("postgres", "postgresql");
        putAlias("postgresql", "postgresql");
        putAlias("mongo", "mongodb");
        putAlias("mongodb", "mongodb");
        putAlias("k8s", "kubernetes");
        putAlias("kubernetes", "kubernetes");
        putAlias("docker", "docker");
        putAlias("git", "git");
        putAlias("aws", "aws");
        putAlias("c#", "csharp");
        putAlias("csharp", "csharp");
        putAlias("c++", "cplusplus");
        putAlias("cpp", "cplusplus");
        putAlias("php", "php");
        putAlias("laravel", "laravel");
    }

    private static void putAlias(String key, String value) {
        ALIASES.put(
                key.toLowerCase().replaceAll("[^a-z0-9]", ""),
                value.toLowerCase().replaceAll("[^a-z0-9]", "")
        );
    }

    // ════════════════════════════════════════════════════════════
    // MAIN METHOD — utilisée pour créer un FreelancerSkill
    // Retourne null si pas de match suffisant (< GOOD_MATCH_THRESHOLD)
    // ════════════════════════════════════════════════════════════
    public SkillMatchResult findMatchingSkill(String input) {

        String normalizedInput = similarityService.normalize(input);

        String aliasKey = normalizedInput.replaceAll("[^a-z0-9]", "");
        if (ALIASES.containsKey(aliasKey)) {
            String aliasTarget = ALIASES.get(aliasKey);
            Skill aliasSkill = skillRepository.findByNormalizedNameIgnoreCase(aliasTarget);

            // ✅ AJOUTEZ ICI
            System.out.println("=== ALIAS DEBUG ===");
            System.out.println("INPUT: " + input);
            System.out.println("ALIAS KEY: " + aliasKey);
            System.out.println("ALIAS TARGET: " + aliasTarget);
            System.out.println("SKILL FOUND: " + aliasSkill);
            System.out.println("===================");

            if (aliasSkill != null) {
                return new SkillMatchResult(aliasSkill, 1.0, true, false);
            }
        }

        SkillMatchResult best = computeBestMatch(normalizedInput);
        return best;
    }


    // ════════════════════════════════════════════════════════════
    // DID YOU MEAN — utilisée par le controller /match
    // Retourne toujours un résultat (suggestion ou exact)
    // ════════════════════════════════════════════════════════════
    public SkillMatchResult findMatchOrSuggest(String input) {

        String normalizedInput = similarityService.normalize(input);

        // 1️⃣ Vérifier alias exact
        String aliasKey = normalizedInput.replaceAll("[^a-z0-9]", "");
        if (ALIASES.containsKey(aliasKey)) {
            String aliasTarget = ALIASES.get(aliasKey);
            Skill aliasSkill = skillRepository
                    .findByNormalizedNameIgnoreCase(aliasTarget);
            if (aliasSkill != null) {
                // C'est un alias exact → match parfait, pas une suggestion
                return new SkillMatchResult(aliasSkill, 1.0, true, false);
            }
        }

        SkillMatchResult best = computeBestMatch(normalizedInput);
        if (best == null) return null;

        double confidence = best.getConfidence();

        // 2️⃣ Match exact (score >= 0.90)
        if (confidence >= EXACT_MATCH_THRESHOLD) {
            return new SkillMatchResult(best.getSkillName(), confidence, true, false);
        }

        // 3️⃣ Bon match (0.70 - 0.90) → match mais pas exact
        if (confidence >= GOOD_MATCH_THRESHOLD) {
            return new SkillMatchResult(best.getSkillName(), confidence, false, false);
        }

        // 4️⃣ "Did you mean ?" (0.45 - 0.70) → suggestion
        if (confidence >= SUGGESTION_MIN_THRESHOLD) {
            return new SkillMatchResult(best.getSkillName(), confidence, false, true);
        }

        // 5️⃣ Trop faible → null
        return null;
    }

    // ════════════════════════════════════════════════════════════
    // CALCUL DU MEILLEUR MATCH (logique commune)
    // ════════════════════════════════════════════════════════════
    private SkillMatchResult computeBestMatch(String normalizedInput) {

        double bestScore = 0.0;
        Skill bestSkill = null;

        for (Skill skill : skillRepository.findAll()) {

            String normalizedSkill = similarityService.normalize(skill.getName());

            double levenshtein = similarityService.calculateSimilarity(
                    normalizedInput, normalizedSkill);

            double jaro = similarityService.calculateJaroWinkler(
                    normalizedInput, normalizedSkill);

            double score = (levenshtein * 0.5) + (jaro * 0.3);

            // Contains boost
            if (normalizedInput.contains(normalizedSkill)
                    || normalizedSkill.contains(normalizedInput)) {
                score += 0.15;
            }

            // Token overlap
            Set<String> inputTokens = new HashSet<>(
                    Arrays.asList(normalizedInput.split(" ")));
            Set<String> skillTokens = new HashSet<>(
                    Arrays.asList(normalizedSkill.split(" ")));
            inputTokens.retainAll(skillTokens);
            score += inputTokens.size() * 0.05;

            // Pénalité longueur
            int lengthDiff = Math.abs(
                    normalizedInput.length() - normalizedSkill.length());
            score -= (lengthDiff * 0.01);

            if (score > bestScore ||
                    (score == bestScore && bestSkill != null
                            && skill.getName().length() > bestSkill.getName().length())) {
                bestScore = score;
                bestSkill = skill;
            }
        }

        if (bestSkill == null) return null;

        return new SkillMatchResult(bestSkill, bestScore, false, false);
    }
}