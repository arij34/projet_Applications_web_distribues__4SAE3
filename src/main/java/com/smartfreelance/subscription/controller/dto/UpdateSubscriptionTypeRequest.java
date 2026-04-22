package com.smartfreelance.subscription.controller.dto;

import com.smartfreelance.subscription.model.SubscriptionType;
import jakarta.validation.constraints.NotNull;

public record UpdateSubscriptionTypeRequest(
        @NotNull SubscriptionType type
) {
}
