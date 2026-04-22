package com.smartfreelance.subscription.controller.dto;

import java.util.List;

public record SubscriptionsMonthlyStatsResponse(
        List<MonthlyCountPoint> series
) {
}
