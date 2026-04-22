package tn.esprit.challengeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SonarCloudResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String qualityGateStatus;
    private int bugs;
    private int codeSmells;
    private int vulnerabilities;
    private int securityHotspots;
    private double coverage;
    private double duplication;
    private int linesOfCode;
    private String pullRequestKey;
    private Date analyzedAt;
    private Integer pointsAwarded;

    @JsonIgnore
    @OneToOne
    private ChallengeParticipation participation;
}
