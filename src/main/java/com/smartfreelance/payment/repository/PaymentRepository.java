package com.smartfreelance.payment.repository;

import com.smartfreelance.payment.model.Payment;
import com.smartfreelance.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndStatus(Long userId, PaymentStatus status);
}
