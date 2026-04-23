package tn.esprit.evenment.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.evenment.entities.Event;

@Repository
public interface EventRepository extends CrudRepository<Event, Long> {
  // Exemple de méthode personnalisée
  Event findByTitre(String titre);
}
