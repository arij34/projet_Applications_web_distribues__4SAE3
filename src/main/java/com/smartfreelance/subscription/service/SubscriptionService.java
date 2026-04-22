package com.smartfreelance.subscription.service;

import com.smartfreelance.subscription.controller.dto.CreateOrUpdateSubscriptionRequest;
import com.smartfreelance.subscription.controller.dto.AdminUpdateSubscriptionRequest;
import com.smartfreelance.subscription.controller.dto.UpdateSubscriptionStatusRequest;
import com.smartfreelance.subscription.controller.dto.UpdateSubscriptionTypeRequest;
import com.smartfreelance.subscription.model.Subscription;
import com.smartfreelance.subscription.model.SubscriptionStatus;
import com.smartfreelance.subscription.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public List<Subscription> findAll() {
        return subscriptionRepository.findAll();
    }

    public Subscription findById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " ));
    }

    public Subscription findByUserId(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found " ));
    }

    /**
     * Create a subscription for a user (1 subscription per user).
     * If it already exists, we update it (upsert behavior).
     */
    @Transactional
    public Subscription createOrUpdate(CreateOrUpdateSubscriptionRequest request) {
        Subscription sub = subscriptionRepository.findByUserId(request.userId())
                .orElseGet(Subscription::new);

        sub.setUserId(request.userId());
        sub.setType(request.type());
        sub.setStartDate(request.startDate() != null ? request.startDate() : LocalDate.now());
        sub.setEndDate(request.endDate());
        sub.setStatus(request.status() != null ? request.status() : SubscriptionStatus.ACTIVE);

        validateDates(sub);

        return subscriptionRepository.save(sub);
    }

    @Transactional
    public Subscription updateType(Long id, UpdateSubscriptionTypeRequest request) {
        Subscription sub = findById(id);
        sub.setType(request.type());
        return subscriptionRepository.save(sub);
    }

    @Transactional
    public Subscription updateStatus(Long id, UpdateSubscriptionStatusRequest request) {
        Subscription sub = findById(id);
        sub.setStatus(request.status());
        return subscriptionRepository.save(sub);
    }

    @Transactional
    public void delete(Long id) {
        if (!subscriptionRepository.existsById(id)) {
            throw new IllegalArgumentException("Subscription not found: id=" + id);
        }
        subscriptionRepository.deleteById(id);
    }

    private void validateDates(Subscription sub) {
        if (sub.getEndDate() != null && sub.getStartDate() != null && sub.getEndDate().isBefore(sub.getStartDate())) {
            throw new IllegalArgumentException("endDate must be >= startDate");
        }
    }

    @Transactional
    public Subscription adminUpdate(Long id, AdminUpdateSubscriptionRequest request) {
        Subscription sub = findById(id);
        sub.setType(request.type());
        sub.setStatus(request.status());
        sub.setEndDate(request.endDate());
        validateDates(sub);
        return subscriptionRepository.save(sub);
    }

    @Transactional
    public Subscription activateVip(Long userId, int days) {
        if (days <= 0) throw new IllegalArgumentException("days must be >= 1");

        Subscription sub = subscriptionRepository.findByUserId(userId)
                .orElseGet(Subscription::new);

        LocalDate today = LocalDate.now();
        sub.setUserId(userId);

        // If user already has an active VIP subscription, extend it (idempotent/renewal behavior)
        if (sub.getId() != null
                && sub.getType() == com.smartfreelance.subscription.model.SubscriptionType.VIP
                && sub.getStatus() == SubscriptionStatus.ACTIVE
                && (sub.getEndDate() == null || !sub.getEndDate().isBefore(today))) {
            // unlimited VIP (endDate null) => nothing to extend
            if (sub.getEndDate() == null) {
                return sub;
            }
            sub.setEndDate(sub.getEndDate().plusDays(days));
            validateDates(sub);
            return subscriptionRepository.save(sub);
        }

        // Otherwise (no subscription / expired / not VIP / not ACTIVE): start a new VIP period from today
        sub.setType(com.smartfreelance.subscription.model.SubscriptionType.VIP);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(today);
        sub.setEndDate(today.plusDays(days));

        validateDates(sub);
        return subscriptionRepository.save(sub);
    }

    public boolean hasVipAccess(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .map(s -> s.getType() == com.smartfreelance.subscription.model.SubscriptionType.VIP
                        && s.getStatus() == SubscriptionStatus.ACTIVE
                        && (s.getEndDate() == null || !s.getEndDate().isBefore(LocalDate.now())))
                .orElse(false);
    }
}
