package com.smartfreelance.subscription.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.smartfreelance.subscription.controller.dto.ActivateVipRequest;
import com.smartfreelance.subscription.controller.dto.AdminUpdateSubscriptionRequest;
import com.smartfreelance.subscription.controller.dto.CreateOrUpdateSubscriptionRequest;
import com.smartfreelance.subscription.controller.dto.SubscriptionsMonthlyStatsResponse;
import com.smartfreelance.subscription.controller.dto.UpdateSubscriptionStatusRequest;
import com.smartfreelance.subscription.controller.dto.UpdateSubscriptionTypeRequest;
import com.smartfreelance.subscription.model.Subscription;
import com.smartfreelance.subscription.service.SubscriptionService;
import com.smartfreelance.subscription.service.SubscriptionStatsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionStatsService subscriptionStatsService;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  SubscriptionStatsService subscriptionStatsService) {
        this.subscriptionService = subscriptionService;
        this.subscriptionStatsService = subscriptionStatsService;
    }

    // Admin endpoints
    @GetMapping("/admin/subscriptions")
    public List<Subscription> getAll() {
        return subscriptionService.findAll();
    }

    @GetMapping("/admin/subscriptions/{id}")
    public Subscription getById(@PathVariable Long id) {
        return subscriptionService.findById(id);
    }

    @DeleteMapping("/admin/subscriptions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        subscriptionService.delete(id);
    }

    @PutMapping("/admin/subscriptions/{id}/status")
    public Subscription adminUpdateStatus(@PathVariable Long id,
                                          @Valid @RequestBody UpdateSubscriptionStatusRequest request) {
        return subscriptionService.updateStatus(id, request);
    }

    @PutMapping("/admin/subscriptions/{id}")
    public Subscription adminUpdate(@PathVariable Long id,
                                    @Valid @RequestBody AdminUpdateSubscriptionRequest request) {
        return subscriptionService.adminUpdate(id, request);
    }

    @GetMapping("/admin/subscriptions/stats/monthly")
    public SubscriptionsMonthlyStatsResponse adminSubscriptionsMonthlyStats(
            @RequestParam(defaultValue = "12") int months
    ) {
        return subscriptionStatsService.vipActivationsLastMonths(months);
    }

    // Client/Freelancer endpoints (user-scoped)
    @GetMapping({"/client/subscriptions/user/{userId}", "/freelancer/subscriptions/user/{userId}"})
    public Subscription getByUserId(@PathVariable Long userId) {
        return subscriptionService.findByUserId(userId);
    }

    /**
     * Creates or updates (upsert) a subscription for a user.
     */
    @PostMapping({"/client/subscriptions", "/freelancer/subscriptions"})
    @ResponseStatus(HttpStatus.CREATED)
    public Subscription createOrUpdate(@Valid @RequestBody CreateOrUpdateSubscriptionRequest request) {
        return subscriptionService.createOrUpdate(request);
    }

    @PutMapping({"/client/subscriptions/{id}/type", "/freelancer/subscriptions/{id}/type"})
    public Subscription updateType(@PathVariable Long id,
                                   @Valid @RequestBody UpdateSubscriptionTypeRequest request) {
        return subscriptionService.updateType(id, request);
    }

    @PutMapping({"/client/subscriptions/{id}/status", "/freelancer/subscriptions/{id}/status"})
    public Subscription updateStatus(@PathVariable Long id,
                                     @Valid @RequestBody UpdateSubscriptionStatusRequest request) {
        return subscriptionService.updateStatus(id, request);
    }

    /**
     * Internal endpoint called by Payment service to activate VIP for N days.
     * Kept under /api/internal and currently OPEN in SecurityConfig? => we will restrict by a static header later if needed.
     */
    @PostMapping("/internal/subscriptions/activate-vip")
    public Subscription activateVip(@Valid @RequestBody ActivateVipRequest request) {
        return subscriptionService.activateVip(request.userId(), request.days());
    }

    /**
     * Used by other services to check premium access.
     */
    @GetMapping({"/client/subscriptions/user/{userId}/vip-access", "/freelancer/subscriptions/user/{userId}/vip-access"})
    public boolean hasVipAccess(@PathVariable Long userId) {
        return subscriptionService.hasVipAccess(userId);
    }
}
