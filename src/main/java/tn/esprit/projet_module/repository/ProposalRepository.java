package tn.esprit.projet_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.projet_module.entity.Proposal;
import tn.esprit.projet_module.entity.ProposalStatus;

import java.util.List;
import java.util.Optional;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByProjectId(Long projectId);
    List<Proposal> findByFreelancerId(Long freelancerId);
    Optional<Proposal> findByProjectIdAndFreelancerId(Long projectId, Long freelancerId);
    boolean existsByProjectIdAndFreelancerId(Long projectId, Long freelancerId);
    long countByProjectId(Long projectId);
    List<Proposal> findByFreelancerIdAndStatus(Long freelancerId, ProposalStatus status);
    boolean existsByProjectIdAndFreelancerIdAndStatus(
            Long projectId, Long freelancerId, ProposalStatus status);  // ← String → ProposalStatus
    List<Proposal> findByFreelancerKeycloakIdAndStatus(
            String freelancerKeycloakId, ProposalStatus status);
    boolean existsByProjectIdAndFreelancerKeycloakId(Long projectId, String keycloakId);
    Optional<Proposal> findByProjectIdAndFreelancerKeycloakId(Long projectId, String keycloakId);
    List<Proposal> findByFreelancerKeycloakId(String keycloakId);
    List<Proposal> findByProjectIdAndStatus(Long projectId, ProposalStatus status);
}