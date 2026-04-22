package tn.esprit.skillvalidationservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tn.esprit.skillvalidationservice.config.RabbitMQConfig;
import tn.esprit.skillvalidationservice.dto.PendingSkillMessage;
import tn.esprit.skillvalidationservice.service.PendingSkillService;

@Component
public class SkillListener {

    private final PendingSkillService service;

    public SkillListener(PendingSkillService service) {
        this.service = service;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void receiveSkill(PendingSkillMessage message) {

        System.out.println("📥 Received skill: " + message.getSuggestedName());

        service.saveFromMessage(
                message.getSuggestedName(),
                message.getNormalizedName(),
                message.getSuggestedBy()
        );
    }
}