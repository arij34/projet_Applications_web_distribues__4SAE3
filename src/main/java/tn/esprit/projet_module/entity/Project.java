package tn.esprit.projet_module.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1000)
    private String description;

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    private Long clientId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private boolean deleteRequested = false;
    @Column(nullable = true)
    private String currentPhase = "OPEN"; // OPEN, ETUDE, DEVELOPPEMENT, TEST, DEPLOIEMENT, CLOTURE
    private String clientEmail;
    private String keycloakId; // UUID Keycloak du client

    public String getKeycloakId() { return keycloakId; }
    public void setKeycloakId(String keycloakId) { this.keycloakId = keycloakId; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String email) { this.clientEmail = email; }
    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String phase) { this.currentPhase = phase; }
    // Skills — cascade ALL pour suppression automatique
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectSkill> skills;

    // Analyse — cascade ALL + orphanRemoval pour suppression automatique
    @JsonIgnore
    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private ProjectAnalysis analysis;

    // ── Lifecycle ──
    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = ProjectStatus.DRAFT;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ===== GETTERS =====

    public Long getId()                     { return id; }
    public String getTitle()                { return title; }
    public String getDescription()          { return description; }
    public LocalDate getDeadline()          { return deadline; }
    public ProjectStatus getStatus()        { return status; }
    public Long getClientId()               { return clientId; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
    public LocalDateTime getUpdatedAt()     { return updatedAt; }
    public boolean isDeleteRequested()      { return deleteRequested; }
    public List<ProjectSkill> getSkills()   { return skills; }
    public ProjectAnalysis getAnalysis()    { return analysis; }

    // ===== SETTERS =====

    public void setId(Long id)                          { this.id = id; }
    public void setTitle(String title)                  { this.title = title; }
    public void setDescription(String description)      { this.description = description; }
    public void setDeadline(LocalDate deadline)         { this.deadline = deadline; }
    public void setStatus(ProjectStatus status)         { this.status = status; }
    public void setClientId(Long clientId)              { this.clientId = clientId; }
    public void setCreatedAt(LocalDateTime createdAt)   { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)   { this.updatedAt = updatedAt; }
    public void setDeleteRequested(boolean v)           { this.deleteRequested = v; }
    public void setSkills(List<ProjectSkill> skills)    { this.skills = skills; }
    public void setAnalysis(ProjectAnalysis analysis)   { this.analysis = analysis; }
}