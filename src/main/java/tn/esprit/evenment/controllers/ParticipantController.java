package tn.esprit.evenment.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.esprit.evenment.entities.Participant;
import tn.esprit.evenment.services.IParticipantService;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
@CrossOrigin(origins = "http://localhost:4200")
public class ParticipantController {

    private final IParticipantService participantService;

    @Autowired
    public ParticipantController(IParticipantService participantService) {
        this.participantService = participantService;
    }

    // ➕ Add Participant (Demande participation)
    @PostMapping
    public Participant addParticipant(@RequestBody Participant participant) {
        return participantService.addParticipant(participant);
    }

    // 📥 Read All
    @GetMapping
    public List<Participant> getAllParticipants() {
        return participantService.getAllParticipants();
    }

    // 📥 Read By Id
    @GetMapping("/{id}")
    public Participant getParticipant(@PathVariable Long id) {
        return participantService.getParticipantById(id);
    }

    // ✏ Update (changer statut ACCEPTED / REJECTED)
    @PutMapping("/{id}")
    public Participant updateParticipant(@PathVariable Long id, @RequestBody Participant participant) {
        participant.setId(id);
        return participantService.updateParticipant(participant);
    }

    // ❌ Delete
    @DeleteMapping("/{id}")
    public void deleteParticipant(@PathVariable Long id) {
        participantService.deleteParticipant(id);
    }

    // 📥 Get Participants by Event
    @GetMapping("/event/{eventId}")
    public List<Participant> getParticipantsByEvent(@PathVariable Long eventId) {
        return participantService.getParticipantsByEvent(eventId);
    }
  @GetMapping("/closed-events")
  public List<Participant> getParticipantsOfClosedEvents() {
    return participantService.getParticipantsOfClosedEvents();
  }
}
