package com.smartfreelance.subscription.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartfreelance.subscription.controller.dto.MonthlyCountPoint;
import com.smartfreelance.subscription.controller.dto.SubscriptionsMonthlyStatsResponse;
import com.smartfreelance.subscription.model.Subscription;
import com.smartfreelance.subscription.model.SubscriptionType;
import com.smartfreelance.subscription.repository.SubscriptionRepository;

@Service
public class SubscriptionStatsService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionStatsService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * VIP activations per month (based on subscription.startDate).
     */
    public SubscriptionsMonthlyStatsResponse vipActivationsLastMonths(int months) {
        if (months <= 0 || months > 60) {
            throw new IllegalArgumentException("months must be between 1 and 60");
        }

        // NOTE: simple in-memory aggregation.
        List<Subscription> all = subscriptionRepository.findAll();
        YearMonth current = YearMonth.now();

        List<MonthlyCountPoint> series = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            LocalDate start = ym.atDay(1);
            LocalDate endExclusive = ym.atEndOfMonth().plusDays(1);

            long count = 0;
            for (Subscription s : all) {
                if (s.getType() != SubscriptionType.VIP) continue;
                LocalDate d = s.getStartDate();
                if (d == null) continue;
                if (!d.isBefore(endExclusive) || d.isBefore(start)) continue;
                count++;
            }

            series.add(new MonthlyCountPoint(ym.toString(), count));
        }

        return new SubscriptionsMonthlyStatsResponse(series);
    }
}
