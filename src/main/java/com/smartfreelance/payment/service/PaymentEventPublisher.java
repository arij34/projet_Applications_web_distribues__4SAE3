package com.smartfreelance.payment.service;

import com.smartfreelance.payment.config.RabbitConfig;
import com.smartfreelance.payment.service.dto.PaymentCompletedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public PaymentEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        rabbitTemplate.convertAndSend(RabbitConfig.PAYMENT_COMPLETED_QUEUE, event);
    }
}