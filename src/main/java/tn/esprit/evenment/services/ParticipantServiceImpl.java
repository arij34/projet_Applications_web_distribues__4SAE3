package tn.esprit.evenment.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.esprit.evenment.entities.EventStatus;
import tn.esprit.evenment.entities.Participant;
import tn.esprit.evenment.repositories.ParticipantRepository;

import java.util.List;

@Service
public class ParticipantServiceImpl implements IParticipantService {

    private final ParticipantRepository participantRepository;

    @Autowired
    public ParticipantServiceImpl(ParticipantRepository participantRepository) {
        this.participantRepository = participantRepository;
    }
  @Override
  public List<Participant> getParticipantsOfClosedEvents() {
    return participantRepository.findByEventStatus(EventStatus.CLOSED);
  }



    @Override
    public Participant addParticipant(Participant participant) {
        return participantRepository.save(participant);
    }

    @Override
    public Participant updateParticipant(Participant participant) {
        return participantRepository.save(participant);
    }

    @Override
    public Participant getParticipantById(Long id) {
        return participantRepository.findById(id).orElse(null);
    }

    @Override
    public List<Participant> getAllParticipants() {
        return (List<Participant>) participantRepository.findAll();
    }

    @Override
    public void deleteParticipant(Long id) {
        participantRepository.deleteById(id);
    }

    @Override
    public List<Participant> getParticipantsByEvent(Long eventId) {
        return participantRepository.findByEventId(eventId);
    }
}
