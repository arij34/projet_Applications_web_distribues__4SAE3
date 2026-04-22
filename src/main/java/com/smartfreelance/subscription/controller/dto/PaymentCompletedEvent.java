package com.smartfreelance.subscription.controller.dto;

import java.math.BigDecimal;

public record PaymentCompletedEvent(
    Long userId,
    String plan,
    BigDecimal amount,
    int discountPercent,
    BigDecimal originalAmount
) {}