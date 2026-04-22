package tn.esprit.projet_module.clients;

import java.util.List;

public class InvitationProjectDTO {

    private Long id;
    private String title;
    private String description;
    private String deadline;

    // Nom complet du client ("FirstName LastName")
    private String clientName;

    // Email du client
    private String clientEmail;

    private List<String> requiredSkills;

    // Budget depuis ProjectAnalysis
    private Integer budgetMin;
    private Integer budgetMax;
    private Integer budgetRecommended;

    // Duration depuis ProjectAnalysis
    private Integer durationEstimatedWeeks;

    public InvitationProjectDTO() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }

    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> s) { this.requiredSkills = s; }

    public Integer getBudgetMin() { return budgetMin; }
    public void setBudgetMin(Integer v) { this.budgetMin = v; }

    public Integer getBudgetMax() { return budgetMax; }
    public void setBudgetMax(Integer v) { this.budgetMax = v; }

    public Integer getBudgetRecommended() { return budgetRecommended; }
    public void setBudgetRecommended(Integer v) { this.budgetRecommended = v; }

    public Integer getDurationEstimatedWeeks() { return durationEstimatedWeeks; }
    public void setDurationEstimatedWeeks(Integer v) { this.durationEstimatedWeeks = v; }
}