package com.smartfreelance.subscription.service;

import com.smartfreelance.subscription.controller.dto.PaymentCompletedEvent;
import com.smartfreelance.subscription.config.RabbitConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class PaymentEventConsumer {

    private final SubscriptionService subscriptionService;

    public PaymentEventConsumer(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @RabbitListener(queues = RabbitConfig.PAYMENT_COMPLETED_QUEUE)
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        // Asynchronous processing: log or perform additional actions
        System.out.println("Received payment completed event: " + event);

        // For example, update statistics or send notifications
        // Since VIP is already activated synchronously, this could be for logging or other async tasks
    }
}