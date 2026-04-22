package tn.esprit.challengeservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "challenges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String idChallenge;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private String technology;
    private String githubUrl;
    private Date startDate;
    private Date endDate;
    @Column(columnDefinition = "TEXT")
    private String image;
    private Long points;
    @Enumerated(EnumType.STRING)
    private ChallengeDifficulty difficulty; // ✅ fixed

    @Enumerated(EnumType.STRING)
    private ChallengeStatus status;

    private Integer maxParticipants;
    @JsonIgnore
    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks;

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("challenge")
    private List<ChallengeParticipation> participations;


}
