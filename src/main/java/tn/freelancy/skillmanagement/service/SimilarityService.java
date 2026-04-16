package tn.freelancy.skillmanagement.service;

import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.springframework.stereotype.Service;

@Service
public class SimilarityService {

    public String normalize(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }
    private final JaroWinklerSimilarity jaroWinkler =
            new JaroWinklerSimilarity();

    public double calculateJaroWinkler(String s1, String s2) {
        return jaroWinkler.apply(s1, s2);
    }

    public double calculateSimilarity(String input, String skill) {

        if (input.equals(skill)) return 1.0;
        if (skill.contains(input)) return 0.90;
        if (input.contains(skill)) return 0.85;
        if (skill.startsWith(input)) return 0.88;

        int distance = levenshteinDistance(input, skill);
        int maxLength = Math.max(input.length(), skill.length());

        if (maxLength == 0) return 0;

        double levScore = 1.0 - ((double) distance / maxLength);

        if (distance == 1) levScore += 0.1;

        return levScore;
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];

        for (int i = 0; i <= a.length(); i++)
            for (int j = 0; j <= b.length(); j++)
                if (i == 0) dp[i][j] = j;
                else if (j == 0) dp[i][j] = i;
                else
                    dp[i][j] = Math.min(
                            Math.min(dp[i - 1][j] + 1,
                                    dp[i][j - 1] + 1),
                            dp[i - 1][j - 1] +
                                    (a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1)
                    );

        return dp[a.length()][b.length()];
    }
}
