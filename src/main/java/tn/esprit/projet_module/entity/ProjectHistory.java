package tn.esprit.projet_module.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_history")
public class ProjectHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private ProjectStatus oldStatus;
    private ProjectStatus newStatus;

    private LocalDateTime changedAt;

    // ── Nouveaux champs pour l'historique de suppression ──
    @Enumerated(EnumType.STRING)
    private AdminAction adminAction; // APPROVED / REJECTED

    private String projectTitle;     // titre gardé même après suppression
    private Long   clientId;         // client gardé même après suppression

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    @PrePersist
    public void onCreate() {
        changedAt = LocalDateTime.now();
    }

    // ===== GETTERS =====
    public Long getId()                   { return id; }
    public ProjectStatus getOldStatus()   { return oldStatus; }
    public ProjectStatus getNewStatus()   { return newStatus; }
    public LocalDateTime getChangedAt()   { return changedAt; }
    public Project getProject()           { return project; }
    public AdminAction getAdminAction()   { return adminAction; }
    public String getProjectTitle()       { return projectTitle; }
    public Long getClientId()             { return clientId; }

    // ===== SETTERS =====
    public void setId(Long id)                          { this.id = id; }
    public void setOldStatus(ProjectStatus oldStatus)   { this.oldStatus = oldStatus; }
    public void setNewStatus(ProjectStatus newStatus)   { this.newStatus = newStatus; }
    public void setChangedAt(LocalDateTime changedAt)   { this.changedAt = changedAt; }
    public void setProject(Project project)             { this.project = project; }
    public void setAdminAction(AdminAction adminAction) { this.adminAction = adminAction; }
    public void setProjectTitle(String projectTitle)    { this.projectTitle = projectTitle; }
    public void setClientId(Long clientId)              { this.clientId = clientId; }
}