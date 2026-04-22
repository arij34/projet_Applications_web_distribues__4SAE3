package com.smartfreelance.payment.service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ActivateVipRequest(
    @NotNull Long userId,
    @Min(value = 1) int days
) {}