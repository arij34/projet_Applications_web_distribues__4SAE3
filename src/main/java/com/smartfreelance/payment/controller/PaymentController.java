package com.smartfreelance.payment.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartfreelance.payment.controller.dto.PaySubscriptionRequest;
import com.smartfreelance.payment.controller.dto.PaySubscriptionResponse;
import com.smartfreelance.payment.controller.dto.PaymentsMonthlyStatsResponse;
import com.smartfreelance.payment.repository.PaymentRepository;
import com.smartfreelance.payment.service.PaymentService;
import com.smartfreelance.payment.service.PaymentStatsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class PaymentController {
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final PaymentStatsService paymentStatsService;

    public PaymentController(PaymentService paymentService,
                             PaymentRepository paymentRepository,
                             PaymentStatsService paymentStatsService) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.paymentStatsService = paymentStatsService;
    }

    @PostMapping({"/client/payments/subscription", "/freelancer/payments/subscription"})
    public PaySubscriptionResponse paySubscription(
            @Valid @RequestBody PaySubscriptionRequest req,
            @AuthenticationPrincipal Jwt jwt
    ) {
        // Get user email from Keycloak token (standard OIDC claim).
        String email = null;
        if (jwt != null) {
            email = firstNonBlank(jwt.getClaimAsString("email"),
                    jwt.getClaimAsString("preferred_username"),
                    jwt.getClaimAsString("upn"));
            // preferred_username can be a username; keep only if it looks like an email
            if (email != null && !email.contains("@")) {
                email = null;
            }
        }
        return paymentService.paySubscription(req, email);
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    @GetMapping({"/client/payments/user/{userId}", "/freelancer/payments/user/{userId}"})
    public Object paymentsForUser(@PathVariable Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/admin/payments/user/{userId}")
    public Object adminPaymentsForUser(@PathVariable Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/admin/payments/stats/monthly")
    public PaymentsMonthlyStatsResponse adminPaymentsMonthlyStats(
            @RequestParam(defaultValue = "12") int months
    ) {
        return paymentStatsService.lastMonths(months);
    }
}
