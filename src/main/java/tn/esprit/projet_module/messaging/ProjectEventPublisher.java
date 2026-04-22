package tn.esprit.projet_module.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ProjectEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final String projectExchange;
    private final String projectCreatedRoutingKey;

    public ProjectEventPublisher(
            RabbitTemplate rabbitTemplate,
            @Value("${app.rabbitmq.projectExchange:project.exchange}") String projectExchange,
            @Value("${app.rabbitmq.projectCreatedRoutingKey:project.created}") String projectCreatedRoutingKey
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.projectExchange = projectExchange;
        this.projectCreatedRoutingKey = projectCreatedRoutingKey;
    }

    public void publishProjectCreated(ProjectCreatedEvent event) {
        rabbitTemplate.convertAndSend(projectExchange, projectCreatedRoutingKey, event);
    }
}
