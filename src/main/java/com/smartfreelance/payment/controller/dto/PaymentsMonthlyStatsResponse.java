package com.smartfreelance.payment.controller.dto;

import java.math.BigDecimal;
import java.util.List;

public record PaymentsMonthlyStatsResponse(
        List<MonthlyStatsPoint> series,
        BigDecimal totalRevenue,
        BigDecimal currentMonthRevenue
) {
}
