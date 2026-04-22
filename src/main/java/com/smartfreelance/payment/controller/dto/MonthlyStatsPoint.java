package com.smartfreelance.payment.controller.dto;

import java.math.BigDecimal;

/**
 * Stats point for a given month (YYYY-MM).
 */
public record MonthlyStatsPoint(
        String month,
        long paymentsCount,
        BigDecimal revenue
) {
}
