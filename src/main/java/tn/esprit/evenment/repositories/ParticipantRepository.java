package tn.esprit.evenment.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.evenment.entities.EventStatus;
import tn.esprit.evenment.entities.Participant;
import tn.esprit.evenment.entities.ParticipationStatus;

import java.util.List;

@Repository
public interface ParticipantRepository extends CrudRepository<Participant, Long> {

  // 🔢 Compter tous les participants d’un événement
  long countByEventId(Long eventId);

  // 🔢 Compter les participants d’un événement par statut (ACCEPTED / REJECTED / PENDING)
  long countByEventIdAndStatus(Long eventId, ParticipationStatus status);

  // 📥 Récupérer tous les participants d’un événement
  List<Participant> findByEventId(Long eventId);

  // 📥 Récupérer les participants par événement et statut
  List<Participant> findByEventIdAndStatus(Long eventId, ParticipationStatus status);
  List<Participant> findByEventStatus(EventStatus status);
}
