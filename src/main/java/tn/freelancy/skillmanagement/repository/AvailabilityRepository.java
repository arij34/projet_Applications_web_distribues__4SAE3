package tn.freelancy.skillmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.freelancy.skillmanagement.entity.Availability;

import java.util.Optional;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    // ✅ AJOUTÉ : recherche par userId (colonne simple Long, plus de relation JPA vers User)
    Optional<Availability> findByUserId(Long userId);
}