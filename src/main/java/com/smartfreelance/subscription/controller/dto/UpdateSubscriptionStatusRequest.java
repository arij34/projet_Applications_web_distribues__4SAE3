package com.smartfreelance.subscription.controller.dto;

import com.smartfreelance.subscription.model.SubscriptionStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSubscriptionStatusRequest(
        @NotNull SubscriptionStatus status
) {
}
