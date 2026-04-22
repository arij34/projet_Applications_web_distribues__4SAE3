package com.smartfreelance.payment.service.dto;

import java.math.BigDecimal;

public record PaymentCompletedEvent(
    Long userId,
    String plan,
    BigDecimal amount,
    int discountPercent,
    BigDecimal originalAmount
) {}