package com.smartfreelance.payment.controller.dto;

import java.time.LocalDate;

import com.smartfreelance.payment.model.PaymentStatus;

public record PaySubscriptionResponse(
        Long paymentId,
        PaymentStatus status,
        String message,
        LocalDate subscriptionEndDate,
        Integer discountPercent,
        java.math.BigDecimal originalAmount,
        java.math.BigDecimal paidAmount
) {}
