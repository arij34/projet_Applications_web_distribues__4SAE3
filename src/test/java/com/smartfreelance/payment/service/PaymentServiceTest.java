package com.smartfreelance.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartfreelance.payment.controller.dto.PaySubscriptionRequest;
import com.smartfreelance.payment.controller.dto.PaySubscriptionResponse;
import com.smartfreelance.payment.model.Payment;
import com.smartfreelance.payment.model.PaymentStatus;
import com.smartfreelance.payment.repository.PaymentRepository;
import com.smartfreelance.payment.service.dto.SubscriptionDto;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private SubscriptionClient subscriptionClient;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void paySubscription_whenSuccess_withoutDiscount_shouldActivateVipAndSendEmail() {
        PaySubscriptionRequest request = validRequest("1234567890123456");
        when(paymentRepository.countByUserIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(0L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(subscriptionClient.activateVip(1L, 30))
                .thenReturn(new SubscriptionDto(9L, 1L, "VIP", LocalDate.now(), LocalDate.now().plusDays(30), "ACTIVE"));

        PaySubscriptionResponse response = paymentService.paySubscription(request, "user@mail.com");

        assertEquals(PaymentStatus.SUCCESS, response.status());
        assertEquals(0, response.discountPercent());
        assertNotNull(response.originalAmount());
        assertEquals(0, response.paidAmount().compareTo(new BigDecimal("29.00")));
        verify(subscriptionClient).activateVip(1L, 30);
        verify(emailService).sendVipUpgradeEmail(
                eq("user@mail.com"),
                eq(new BigDecimal("29.00")),
                eq(0),
                eq(response.paidAmount()),
                any(LocalDate.class)
        );
    }

    @Test
    void paySubscription_whenEverySixthSuccess_shouldApplyDiscount() {
        PaySubscriptionRequest request = validRequest("1234567890123456");
        when(paymentRepository.countByUserIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(5L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(subscriptionClient.activateVip(1L, 30))
                .thenReturn(new SubscriptionDto(10L, 1L, "VIP", LocalDate.now(), LocalDate.now().plusDays(30), "ACTIVE"));

        PaySubscriptionResponse response = paymentService.paySubscription(request, "user@mail.com");

        assertEquals(PaymentStatus.SUCCESS, response.status());
        assertEquals(50, response.discountPercent());
        assertEquals(0, response.paidAmount().compareTo(new BigDecimal("14.50")));
        verify(emailService).sendVipUpgradeEmail(
                eq("user@mail.com"),
                eq(new BigDecimal("29.00")),
                eq(50),
                eq(response.paidAmount()),
                any(LocalDate.class)
        );
    }

    @Test
    void paySubscription_whenCardEndsWithZero_shouldFailWithoutActivatingVip() {
        PaySubscriptionRequest request = validRequest("1234567890123450");
        when(paymentRepository.countByUserIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(1L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaySubscriptionResponse response = paymentService.paySubscription(request, "user@mail.com");

        assertEquals(PaymentStatus.FAILED, response.status());
        assertEquals(0, response.discountPercent());
        assertNull(response.originalAmount());
        assertEquals(0, response.paidAmount().compareTo(new BigDecimal("29.00")));
        verify(subscriptionClient, never()).activateVip(anyLong(), anyInt());
        verify(emailService, never()).sendVipUpgradeEmail(any(), any(), any(Integer.class), any(), any());
    }

    @Test
    void paySubscription_whenEmailThrows_shouldKeepPaymentSuccessful() {
        PaySubscriptionRequest request = validRequest("1234567890123456");
        when(paymentRepository.countByUserIdAndStatus(1L, PaymentStatus.SUCCESS)).thenReturn(0L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(subscriptionClient.activateVip(1L, 30))
                .thenReturn(new SubscriptionDto(9L, 1L, "VIP", LocalDate.now(), LocalDate.now().plusDays(30), "ACTIVE"));
        doThrow(new IllegalStateException("mail unavailable"))
                .when(emailService)
                .sendVipUpgradeEmail(any(), any(), any(Integer.class), any(), any());

        PaySubscriptionResponse response = paymentService.paySubscription(request, "user@mail.com");

        assertEquals(PaymentStatus.SUCCESS, response.status());
        verify(subscriptionClient).activateVip(1L, 30);
    }

    private PaySubscriptionRequest validRequest(String cardNumber) {
        return new PaySubscriptionRequest(
                1L,
                "vip",
                cardNumber,
                "12/29",
                "123",
                "John Doe"
        );
    }
}
