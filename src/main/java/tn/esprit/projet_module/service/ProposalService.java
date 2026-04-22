package tn.esprit.projet_module.service;

import org.springframework.stereotype.Service;
import tn.esprit.projet_module.entity.Proposal;
import tn.esprit.projet_module.entity.ProposalStatus;
import tn.esprit.projet_module.entity.Project;
import tn.esprit.projet_module.repository.ProposalRepository;
import tn.esprit.projet_module.repository.ProjectRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProjectRepository projectRepository;

    public ProposalService(ProposalRepository proposalRepository,
                           ProjectRepository projectRepository) {
        this.proposalRepository = proposalRepository;
        this.projectRepository = projectRepository;
    }

    public boolean hasAcceptedProposal(Long projectId, Long freelancerId) {
        return proposalRepository.existsByProjectIdAndFreelancerIdAndStatus(
                projectId, freelancerId, ProposalStatus.ACCEPTED
        );
    }

    /**
     * Freelancer joins a project (creates a proposal).
     */
    public Proposal joinProject(Long projectId, Long freelancerId, Double bidAmount, Integer deliveryWeeks,
                                String coverLetter, String portfolioUrl, String questionToClient,
                                LocalDate availableFrom) {
        if (proposalRepository.existsByProjectIdAndFreelancerId(projectId, freelancerId)) {
            throw new IllegalArgumentException("You already submitted a proposal for this project.");
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        Proposal p = new Proposal();
        p.setProject(project);
        p.setFreelancerId(freelancerId);
        p.setBidAmount(bidAmount != null ? bidAmount : 0.0);
        p.setDeliveryWeeks(deliveryWeeks != null ? deliveryWeeks : 0);
        p.setCoverLetter(coverLetter != null ? coverLetter : "");
        p.setPortfolioUrl(portfolioUrl != null ? portfolioUrl : "");
        p.setQuestionToClient(questionToClient != null ? questionToClient : "");
        p.setAvailableFrom(availableFrom);
        return proposalRepository.save(p);
    }

    public List<Proposal> getProposalsByProjectId(Long projectId) {
        return proposalRepository.findByProjectId(projectId);
    }
}