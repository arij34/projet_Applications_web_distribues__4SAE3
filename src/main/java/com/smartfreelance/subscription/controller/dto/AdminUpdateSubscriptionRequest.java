package com.smartfreelance.subscription.controller.dto;

import com.smartfreelance.subscription.model.SubscriptionStatus;
import com.smartfreelance.subscription.model.SubscriptionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;


public record AdminUpdateSubscriptionRequest(
        @NotNull SubscriptionType type,
        @NotNull SubscriptionStatus status,
        LocalDate endDate
) {
}
