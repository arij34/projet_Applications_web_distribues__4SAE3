package tn.esprit.evenment.services;

import tn.esprit.evenment.entities.Event;

import java.util.List;
import java.util.Map;

public interface IEventService {
  Event addEvent(Event event);
  Event updateEvent(Event event);
  Event getEventById(Long id);
  List<Event> getAllEvents();
  void deleteEvent(Long id);

  // 🔢 Calcul taux de participation
  double calculateRate(Long eventId);

  // 🏷 Classification
  String classifyEvent(Long eventId);

  // ⏰ Suggestion horaire
  String suggestBestTime();

  // 📊 Analyse complète
  Map<String, Object> analyseEvent(Long eventId);
  // ✅ Mise à jour automatique des statuts
  void updateEventStatusesAutomatically();
  String detectRisk(Long eventId);

}
