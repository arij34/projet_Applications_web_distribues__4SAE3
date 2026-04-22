package com.smartfreelance.subscription.service;

import com.smartfreelance.subscription.model.SubscriptionStatus;
import com.smartfreelance.subscription.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * CRON that expires subscriptions when endDate < today.
 */
@Component
public class SubscriptionExpirationJob {
    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionExpirationJob(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Scheduled(cron = "0 0 2 * * *") // every day at 02:00
    @Transactional
    public void expireSubscriptions() {
        LocalDate today = LocalDate.now();
        subscriptionRepository.findAll().forEach(s -> {
            if (s.getEndDate() != null && s.getEndDate().isBefore(today) && s.getStatus() != SubscriptionStatus.EXPIRED) {
                s.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(s);
            }
        });
    }
}
