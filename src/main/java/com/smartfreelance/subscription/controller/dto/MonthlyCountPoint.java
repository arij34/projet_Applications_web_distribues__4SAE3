package com.smartfreelance.subscription.controller.dto;

/**
 * Simple monthly point (YYYY-MM -> count).
 */
public record MonthlyCountPoint(
        String month,
        long count
) {
}
