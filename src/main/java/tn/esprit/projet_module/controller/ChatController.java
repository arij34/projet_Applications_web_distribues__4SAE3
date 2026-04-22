package tn.esprit.projet_module.controller;

import tn.esprit.projet_module.entity.Chatmessagedto;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import tn.esprit.projet_module.entity.ChatMessage;
import tn.esprit.projet_module.repository.ChatMessageRepository;
import java.time.LocalDateTime;

@Controller   // ← garde juste @Controller pour WebSocket
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository messageRepo;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          ChatMessageRepository messageRepo) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepo       = messageRepo;
    }

    @MessageMapping("/chat/{projectId}")
    public void sendMessage(@DestinationVariable Long projectId,
                            @Payload Chatmessagedto dto) {
        ChatMessage message = new ChatMessage();
        message.setProjectId(projectId);
        message.setSenderName(dto.getSenderName());
        message.setSenderRole(dto.getSenderRole());
        message.setSenderId(dto.getSenderId());
        message.setContent(dto.getContent());
        message.setSentAt(LocalDateTime.now());
        messageRepo.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + projectId, message);
    }
}

