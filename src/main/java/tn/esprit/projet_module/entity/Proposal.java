package tn.esprit.projet_module.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "proposals")
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "freelancer_id", nullable = false)
    private Long freelancerId;

    @Column(name = "bid_amount", nullable = false)
    private Double bidAmount;

    @Column(name = "delivery_weeks", nullable = false)
    private Integer deliveryWeeks;

    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "question_to_client", columnDefinition = "TEXT")
    private String questionToClient;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ProposalStatus status = ProposalStatus.PENDING;


    @Column(name = "created_at")
    private LocalDateTime createdAt;
    @Column(name = "freelancer_keycloak_id")
    private String freelancerKeycloakId;

    // Getter & Setter
    public String getFreelancerKeycloakId() { return freelancerKeycloakId; }
    public void setFreelancerKeycloakId(String freelancerKeycloakId) {
        this.freelancerKeycloakId = freelancerKeycloakId;
    }

    @PrePersist
    public void prePersist() { this.createdAt = LocalDateTime.now(); }


    // ── Getters & Setters ──
    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public Long getFreelancerId() { return freelancerId; }
    public void setFreelancerId(Long freelancerId) { this.freelancerId = freelancerId; }
    public Double getBidAmount() { return bidAmount; }
    public void setBidAmount(Double bidAmount) { this.bidAmount = bidAmount; }
    public Integer getDeliveryWeeks() { return deliveryWeeks; }
    public void setDeliveryWeeks(Integer deliveryWeeks) { this.deliveryWeeks = deliveryWeeks; }
    public LocalDate getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalDate availableFrom) { this.availableFrom = availableFrom; }
    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }
    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }
    public String getQuestionToClient() { return questionToClient; }
    public void setQuestionToClient(String questionToClient) { this.questionToClient = questionToClient; }
    public ProposalStatus getStatus() { return status; }
    public void setStatus(ProposalStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}