package com.smartfreelance.subscription.controller.dto;

import com.smartfreelance.subscription.model.SubscriptionStatus;
import com.smartfreelance.subscription.model.SubscriptionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateOrUpdateSubscriptionRequest(
        @NotNull Long userId,
        @NotNull SubscriptionType type,
        LocalDate startDate,
        LocalDate endDate,
        SubscriptionStatus status
) {
}
