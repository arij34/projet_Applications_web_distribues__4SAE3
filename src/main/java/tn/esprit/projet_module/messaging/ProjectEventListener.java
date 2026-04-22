package tn.esprit.projet_module.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class ProjectEventListener {

    @RabbitListener(queues = "${app.rabbitmq.projectCreatedQueue:project.created.queue}")
    public void onProjectCreated(ProjectCreatedEvent event) {
        // Minimal consumer for the demo: proves async communication is wired.
        System.out.println("[RabbitMQ] Project created event received: id=" + event.projectId()
                + ", title=" + event.title()
                + ", clientId=" + event.clientId()
                + ", at=" + event.createdAt());
    }
}
