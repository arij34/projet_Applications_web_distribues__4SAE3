package tn.esprit.projet_module.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_projects",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"freelancer_id", "project_id"}),
                @UniqueConstraint(columnNames = {"freelancer_keycloak_id", "project_id"}) // ← AJOUT
        })
public class SavedProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "freelancer_id", nullable = true)  // ← nullable = true
    private Long freelancerId;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "saved_at")
    private LocalDateTime savedAt;
    @Column(name = "freelancer_keycloak_id")
    private String freelancerKeycloakId;

    public String getFreelancerKeycloakId() { return freelancerKeycloakId; }
    public void setFreelancerKeycloakId(String id) { this.freelancerKeycloakId = id; }
    @PrePersist
    public void prePersist() {
        this.savedAt = LocalDateTime.now();
    }

    // Getters + Setters
    public Long getId() { return id; }
    public Long getFreelancerId() { return freelancerId; }
    public void setFreelancerId(Long freelancerId) { this.freelancerId = freelancerId; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public LocalDateTime getSavedAt() { return savedAt; }
}