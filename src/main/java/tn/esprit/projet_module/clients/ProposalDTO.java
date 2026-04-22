package tn.esprit.projet_module.clients;

import java.time.LocalDate;

public class ProposalDTO {

    private Long id;
    private Long freelancerId;
    private String status;
    private LocalDate deadline;

    public ProposalDTO() {}

    public ProposalDTO(Long id, Long freelancerId, String status, LocalDate deadline) {
        this.id = id;
        this.freelancerId = freelancerId;
        this.status = status;
        this.deadline = deadline;
    }
    public Long getId() { return id; }
    public Long getFreelancerId() { return freelancerId; }
    public String getStatus() { return status; }
    public LocalDate getDeadline() { return deadline; }
}