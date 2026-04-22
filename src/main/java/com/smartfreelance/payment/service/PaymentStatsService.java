package com.smartfreelance.payment.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartfreelance.payment.controller.dto.MonthlyStatsPoint;
import com.smartfreelance.payment.controller.dto.PaymentsMonthlyStatsResponse;
import com.smartfreelance.payment.model.Payment;
import com.smartfreelance.payment.model.PaymentStatus;
import com.smartfreelance.payment.repository.PaymentRepository;

@Service
public class PaymentStatsService {

    private final PaymentRepository paymentRepository;

    public PaymentStatsService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /**
     * Returns monthly stats for the last N months (including current month).
     */
    public PaymentsMonthlyStatsResponse lastMonths(int months) {
        if (months <= 0 || months > 60) {
            throw new IllegalArgumentException("months must be between 1 and 60");
        }

        // NOTE: For simplicity we read all payments and aggregate in memory.
        // For large DB, we should replace this with a GROUP BY query.
        List<Payment> all = paymentRepository.findAll();

        YearMonth current = YearMonth.now();
        List<MonthlyStatsPoint> series = new ArrayList<>();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal currentMonthRevenue = BigDecimal.ZERO;

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.atEndOfMonth().plusDays(1).atStartOfDay();

            long count = 0;
            BigDecimal revenue = BigDecimal.ZERO;

            for (Payment p : all) {
                if (p.getStatus() != PaymentStatus.SUCCESS) continue;
                LocalDateTime created = p.getCreatedAt();
                if (created == null) continue;
                if (!created.isBefore(end) || created.isBefore(start)) continue;

                count++;
                if (p.getAmount() != null) {
                    revenue = revenue.add(p.getAmount());
                }
            }

            totalRevenue = totalRevenue.add(revenue);
            if (ym.equals(current)) {
                currentMonthRevenue = revenue;
            }

            series.add(new MonthlyStatsPoint(ym.toString(), count, revenue));
        }

        return new PaymentsMonthlyStatsResponse(series, totalRevenue, currentMonthRevenue);
    }
}
