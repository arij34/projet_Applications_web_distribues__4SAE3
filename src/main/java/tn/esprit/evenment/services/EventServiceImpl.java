package tn.esprit.evenment.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.evenment.entities.Event;
import tn.esprit.evenment.entities.EventStatus;
import tn.esprit.evenment.entities.ParticipationStatus;
import tn.esprit.evenment.repositories.EventRepository;
import tn.esprit.evenment.repositories.ParticipantRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class EventServiceImpl implements IEventService {

  private final EventRepository eventRepository;
  private final ParticipantRepository participantRepository;

  @Autowired
  public EventServiceImpl(EventRepository eventRepository,
                          ParticipantRepository participantRepository) {
    this.eventRepository = eventRepository;
    this.participantRepository = participantRepository;
  }
  // ✅ Vérifie toutes les minutes si des événements doivent être fermés
  @Scheduled(fixedRate = 30000) // toutes les 30 secondes
  public void updateEventStatusesAutomatically() {
    List<Event> events = getAllEvents();
    LocalDateTime now = LocalDateTime.now();

    for (Event e : events) {
      if (e.getDateDebut() != null
        && e.getDateDebut().isBefore(now)
        && e.getStatus() == EventStatus.OPEN) {
        e.setStatus(EventStatus.CLOSED);
        eventRepository.save(e);
      }
    }
  }


  @Override
  public Event addEvent(Event event) {
    return eventRepository.save(event);
  }

  @Override
  public Event updateEvent(Event event) {
    return eventRepository.save(event);
  }

  @Override
  public Event getEventById(Long id) {
    return eventRepository.findById(id).orElse(null);
  }

  @Override
  public List<Event> getAllEvents() {
    return StreamSupport.stream(eventRepository.findAll().spliterator(), false)
      .collect(Collectors.toList());
  }

  @Override
  public void deleteEvent(Long id) {
    eventRepository.deleteById(id);
  }

  /**
   * ✅ Calcul du taux avec base minimale de 5
   * Exemple : 1 accepté → 20%, 2 acceptés → 40%, etc.
   */
  @Override
  public double calculateRate(Long eventId) {
    Event event = eventRepository.findById(eventId).orElse(null);
    if (event == null) return 0;

    long accepted = participantRepository.countByEventIdAndStatus(eventId, ParticipationStatus.ACCEPTED);
    long total = participantRepository.countByEventId(eventId);

    // Base minimale fixée à 5
    long base = Math.max(total, 5);

    return (accepted * 100.0) / base;
  }

  @Override
  public String classifyEvent(Long eventId) {
    double rate = calculateRate(eventId);
    if (rate >= 70) {
      return "POPULAIRE";
    } else if (rate >= 40) {
      return "MOYEN";
    } else {
      return "FAIBLE";
    }
  }

  @Override
  public String suggestBestTime() {
    Map<Integer, List<Double>> hourRates = new HashMap<>();
    List<Event> events = getAllEvents();

    for (Event e : events) {
      if (e.getDateDebut() != null) {
        int hour = e.getDateDebut().getHour();
        double rate = calculateRate(e.getId());
        hourRates.computeIfAbsent(hour, k -> new ArrayList<>()).add(rate);
      }
    }

    int bestHour = 0;
    double bestAvg = 0;

    for (Map.Entry<Integer, List<Double>> entry : hourRates.entrySet()) {
      double avg = entry.getValue().stream().mapToDouble(d -> d).average().orElse(0);
      if (avg > bestAvg) {
        bestAvg = avg;
        bestHour = entry.getKey();
      }
    }

    return bestHour + ":00";
  }

  @Override
  public Map<String, Object> analyseEvent(Long eventId) {
    double rate = calculateRate(eventId);
    String classification = classifyEvent(eventId);
    String suggestedTime = suggestBestTime();

    Map<String, Object> result = new HashMap<>();
    result.put("rate", rate);
    result.put("classification", classification);
    result.put("suggestedTime", suggestedTime);

    return result;
  }
  @Override
  public String detectRisk(Long eventId) {
    // Vérifier si l'événement existe
    Event e = eventRepository.findById(eventId)
      .orElseThrow(() -> new RuntimeException("Event not found"));

    // Calcul du taux de participation
    double rate = calculateRate(eventId);

    // Calcul du nombre de jours restants avant le début
    long daysLeft = ChronoUnit.DAYS.between(LocalDateTime.now(), e.getDateDebut());

    // ✅ Logique de risque
    if (rate < 30 && daysLeft < 3) {
      return "RISQUE_ELEVÉ";
    } else if (rate < 50) {
      return "RISQUE_MOYEN";
    } else {
      return "STABLE";
    }
  }
}
