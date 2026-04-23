package tn.esprit.evenment.services;

import tn.esprit.evenment.entities.Participant;
import java.util.List;

public interface IParticipantService {
    Participant addParticipant(Participant participant);
    Participant updateParticipant(Participant participant);
    Participant getParticipantById(Long id);
    List<Participant> getAllParticipants();
    void deleteParticipant(Long id);
    List<Participant> getParticipantsByEvent(Long eventId);
    List<Participant> getParticipantsOfClosedEvents();
}
