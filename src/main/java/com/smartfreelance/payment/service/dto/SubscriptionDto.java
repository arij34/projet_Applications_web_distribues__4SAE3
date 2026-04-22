package com.smartfreelance.payment.service.dto;

import java.time.LocalDate;

/**
 * Minimal DTO for Subscription service response.
 * We only need endDate to include it in the payment receipt email.
 */
public record SubscriptionDto(
        Long id,
        Long userId,
        String type,
        LocalDate startDate,
        LocalDate endDate,
        String status
) {
}
