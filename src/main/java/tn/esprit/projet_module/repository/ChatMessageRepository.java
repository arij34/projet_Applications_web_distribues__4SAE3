package tn.esprit.projet_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.projet_module.entity.ChatMessage;
import java.util.List;

public interface ChatMessageRepository
        extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByProjectIdOrderBySentAtAsc(Long projectId);
}