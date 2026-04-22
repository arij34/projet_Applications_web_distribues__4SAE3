package tn.esprit.projet_module.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.projectExchange:project.exchange}")
    private String projectExchange;

    @Value("${app.rabbitmq.projectCreatedQueue:project.created.queue}")
    private String projectCreatedQueue;

    @Value("${app.rabbitmq.projectCreatedRoutingKey:project.created}")
    private String projectCreatedRoutingKey;

    @Bean
    public TopicExchange projectExchange() {
        return new TopicExchange(projectExchange);
    }

    @Bean
    public Queue projectCreatedQueue() {
        return new Queue(projectCreatedQueue, true);
    }

    @Bean
    public Binding projectCreatedBinding(Queue projectCreatedQueue, TopicExchange projectExchange) {
        return BindingBuilder.bind(projectCreatedQueue).to(projectExchange).with(projectCreatedRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
