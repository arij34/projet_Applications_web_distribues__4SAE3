package tn.esprit.evenment.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.esprit.evenment.entities.Event;
import tn.esprit.evenment.services.IEventService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:4200")
public class EventController {

  private final IEventService eventService;

  @Autowired
  public EventController(IEventService eventService) {
    this.eventService = eventService;
  }

  // ➕ Create
  @PostMapping
  public Event addEvent(@RequestBody Event event) {
    return eventService.addEvent(event);
  }

  // 📥 Read All
  @GetMapping
  public List<Event> getAllEvents() {
    return eventService.getAllEvents();
  }

  // 📥 Read By Id
  @GetMapping("/{id}")
  public Event getEvent(@PathVariable Long id) {
    return eventService.getEventById(id);
  }

  // ✏ Update
  @PutMapping("/{id}")
  public Event updateEvent(@PathVariable Long id, @RequestBody Event event) {
    event.setId(id);
    return eventService.updateEvent(event);
  }

  // ❌ Delete
  @DeleteMapping("/{id}")
  public void deleteEvent(@PathVariable Long id) {
    eventService.deleteEvent(id);
  }

  // 📊 Analyse statistique d’un événement
  @GetMapping("/{id}/analyse")
  public Map<String, Object> analyseEvent(@PathVariable Long id) {
    return eventService.analyseEvent(id);
  }
  // ✅ Endpoint pour forcer la mise à jour des statuts
  @GetMapping("/{id}/risk")
  public String detectRisk(@PathVariable Long id) {
    return eventService.detectRisk(id);
  }


}
