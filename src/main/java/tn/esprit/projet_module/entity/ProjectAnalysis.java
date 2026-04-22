package tn.esprit.projet_module.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "project_analysis")
public class ProjectAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore  // ← évite la boucle infinie Project ↔ ProjectAnalysis
    @OneToOne
    @JoinColumn(name = "project_id", unique = true)
    private Project project;

    // ── Budget ──
    private Integer budgetMin;
    private Integer budgetMax;
    private Integer budgetRecommended;
    private Integer hourlyRateAvg;

    // ── Durée ──
    private Integer durationMinWeeks;
    private Integer durationMaxWeeks;
    private Integer durationEstimatedWeeks;

    @Column(length = 500)
    private String durationWarning;

    // ── Complexité ──
    private String complexityLevel;
    private Integer complexityScore;

    // ── Risque ──
    private String riskLevel;
    private Integer riskScore;

    @Column(length = 1000)
    private String riskFactors;

    @Column(length = 500)
    private String riskAdvice;

    // ── Profit ──
    private Integer platformRevenue;
    private Integer freelancerProfit;
    private Integer netProjectCost;

    // ── Freelancers ──
    private Integer freelancersEstimatedCount;
    private String  freelancersAvailability;

    // ── Feasibility ──
    private Integer feasibilityScore;

    // ===== GETTERS & SETTERS =====

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public Integer getBudgetMin() { return budgetMin; }
    public void setBudgetMin(Integer v) { this.budgetMin = v; }

    public Integer getBudgetMax() { return budgetMax; }
    public void setBudgetMax(Integer v) { this.budgetMax = v; }

    public Integer getBudgetRecommended() { return budgetRecommended; }
    public void setBudgetRecommended(Integer v) { this.budgetRecommended = v; }

    public Integer getHourlyRateAvg() { return hourlyRateAvg; }
    public void setHourlyRateAvg(Integer v) { this.hourlyRateAvg = v; }

    public Integer getDurationMinWeeks() { return durationMinWeeks; }
    public void setDurationMinWeeks(Integer v) { this.durationMinWeeks = v; }

    public Integer getDurationMaxWeeks() { return durationMaxWeeks; }
    public void setDurationMaxWeeks(Integer v) { this.durationMaxWeeks = v; }

    public Integer getDurationEstimatedWeeks() { return durationEstimatedWeeks; }
    public void setDurationEstimatedWeeks(Integer v) { this.durationEstimatedWeeks = v; }

    public String getDurationWarning() { return durationWarning; }
    public void setDurationWarning(String v) { this.durationWarning = v; }

    public String getComplexityLevel() { return complexityLevel; }
    public void setComplexityLevel(String v) { this.complexityLevel = v; }

    public Integer getComplexityScore() { return complexityScore; }
    public void setComplexityScore(Integer v) { this.complexityScore = v; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String v) { this.riskLevel = v; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer v) { this.riskScore = v; }

    public String getRiskFactors() { return riskFactors; }
    public void setRiskFactors(String v) { this.riskFactors = v; }

    public String getRiskAdvice() { return riskAdvice; }
    public void setRiskAdvice(String v) { this.riskAdvice = v; }

    public Integer getPlatformRevenue() { return platformRevenue; }
    public void setPlatformRevenue(Integer v) { this.platformRevenue = v; }

    public Integer getFreelancerProfit() { return freelancerProfit; }
    public void setFreelancerProfit(Integer v) { this.freelancerProfit = v; }

    public Integer getNetProjectCost() { return netProjectCost; }
    public void setNetProjectCost(Integer v) { this.netProjectCost = v; }

    public Integer getFreelancersEstimatedCount() { return freelancersEstimatedCount; }
    public void setFreelancersEstimatedCount(Integer v) { this.freelancersEstimatedCount = v; }

    public String getFreelancersAvailability() { return freelancersAvailability; }
    public void setFreelancersAvailability(String v) { this.freelancersAvailability = v; }

    public Integer getFeasibilityScore() { return feasibilityScore; }
    public void setFeasibilityScore(Integer v) { this.feasibilityScore = v; }
}