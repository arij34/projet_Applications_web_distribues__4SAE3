package tn.esprit.projet_module.clients;



public class ProjectAnalysisDTO {

    private String complexityLevel;
    private Integer complexityScore;

    private String freelancersAvailability;
    private Integer freelancersEstimatedCount;

    private String riskLevel;
    private Integer riskScore;
    private Integer budgetMin;
    private Integer budgetMax;
    private Integer budgetRecommended;
    private Integer durationEstimatedWeeks;

    // getters & setters

    public String getComplexityLevel() {
        return complexityLevel;
    }

    public void setComplexityLevel(String complexityLevel) {
        this.complexityLevel = complexityLevel;
    }

    public Integer getComplexityScore() {
        return complexityScore;
    }

    public void setComplexityScore(Integer complexityScore) {
        this.complexityScore = complexityScore;
    }

    public String getFreelancersAvailability() {
        return freelancersAvailability;
    }

    public void setFreelancersAvailability(String freelancersAvailability) {
        this.freelancersAvailability = freelancersAvailability;
    }

    public Integer getFreelancersEstimatedCount() {
        return freelancersEstimatedCount;
    }

    public void setFreelancersEstimatedCount(Integer freelancersEstimatedCount) {
        this.freelancersEstimatedCount = freelancersEstimatedCount;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }
    public Integer getBudgetMin() {
        return budgetMin;
    }
    public void setBudgetMin(Integer budgetMin) {
        this.budgetMin = budgetMin;
    }
    public Integer getBudgetMax() {
        return budgetMax;
    }
    public void setBudgetMax(Integer budgetMax) {
        this.budgetMax = budgetMax;
    }
    public Integer getBudgetRecommended() {
        return budgetRecommended;
    }
    public void setBudgetRecommended(Integer budgetRecommended) {
        this.budgetRecommended = budgetRecommended;
    }
    public Integer getDurationEstimatedWeeks() {
        return durationEstimatedWeeks;
    }
    public void setDurationEstimatedWeeks(Integer durationEstimatedWeeks) {
        this.durationEstimatedWeeks = durationEstimatedWeeks;
    }

}
