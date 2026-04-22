package tn.esprit.projet_module.clients;


public class MatchingProposalRequest {

    private Long projectId;
    private Long freelancerId;

    private Double bidAmount;
    private Integer deliveryWeeks;

    private String coverLetter;
    private String questionToClient;

    private String availableFrom; // yyyy-MM-dd,// optionnel
    private String freelancerKeycloakId;

    public String getFreelancerKeycloakId() { return freelancerKeycloakId; }
    public void setFreelancerKeycloakId(String freelancerKeycloakId) {
        this.freelancerKeycloakId = freelancerKeycloakId;
    }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getFreelancerId() { return freelancerId; }
    public void setFreelancerId(Long freelancerId) { this.freelancerId = freelancerId; }

    public Double getBidAmount() { return bidAmount; }
    public void setBidAmount(Double bidAmount) { this.bidAmount = bidAmount; }

    public Integer getDeliveryWeeks() { return deliveryWeeks; }
    public void setDeliveryWeeks(Integer deliveryWeeks) { this.deliveryWeeks = deliveryWeeks; }

    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public String getQuestionToClient() { return questionToClient; }
    public void setQuestionToClient(String questionToClient) { this.questionToClient = questionToClient; }

    public String getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(String availableFrom) { this.availableFrom = availableFrom; }
}