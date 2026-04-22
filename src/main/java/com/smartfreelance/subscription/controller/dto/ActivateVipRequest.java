package com.smartfreelance.subscription.controller.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ActivateVipRequest(
        @NotNull Long userId,
        @Min(value = 1, message = "days must be >= 1") int days
) {}
