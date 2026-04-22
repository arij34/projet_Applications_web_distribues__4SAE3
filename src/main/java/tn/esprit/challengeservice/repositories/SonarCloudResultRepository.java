package tn.esprit.challengeservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.challengeservice.entities.SonarCloudResult;

import java.util.Optional;

public interface SonarCloudResultRepository extends JpaRepository<SonarCloudResult, String> {

    @Query("SELECT s FROM SonarCloudResult s WHERE s.participation.id = :participationId")
    Optional<SonarCloudResult> findByParticipationId(@Param("participationId") String participationId);
}
