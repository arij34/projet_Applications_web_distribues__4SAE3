package com.smartfreelance.subscription.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartfreelance.subscription.controller.dto.CreateOrUpdateSubscriptionRequest;
import com.smartfreelance.subscription.model.Subscription;
import com.smartfreelance.subscription.model.SubscriptionStatus;
import com.smartfreelance.subscription.model.SubscriptionType;
import com.smartfreelance.subscription.repository.SubscriptionRepository;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    @Test
    void createOrUpdate_whenNewSubscription_shouldSetDefaults() {
        CreateOrUpdateSubscriptionRequest request = new CreateOrUpdateSubscriptionRequest(
                10L,
                SubscriptionType.VIP,
                null,
                LocalDate.now().plusDays(30),
                null
        );

        when(subscriptionRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Subscription saved = subscriptionService.createOrUpdate(request);

        assertEquals(10L, saved.getUserId());
        assertEquals(SubscriptionType.VIP, saved.getType());
        assertEquals(SubscriptionStatus.ACTIVE, saved.getStatus());
        assertEquals(LocalDate.now(), saved.getStartDate());
    }

    @Test
    void createOrUpdate_whenInvalidDates_shouldThrow() {
        CreateOrUpdateSubscriptionRequest request = new CreateOrUpdateSubscriptionRequest(
                11L,
                SubscriptionType.FREE,
                LocalDate.now(),
                LocalDate.now().minusDays(1),
                SubscriptionStatus.ACTIVE
        );

        when(subscriptionRepository.findByUserId(11L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> subscriptionService.createOrUpdate(request));
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void activateVip_whenDaysInvalid_shouldThrow() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> subscriptionService.activateVip(12L, 0)
        );
        assertTrue(ex.getMessage().contains("days must be >= 1"));
    }

    @Test
    void activateVip_whenAlreadyActiveVip_shouldExtendEndDate() {
        Subscription existing = new Subscription(
                1L,
                SubscriptionType.VIP,
                LocalDate.now().minusDays(5),
                LocalDate.now().plusDays(10),
                SubscriptionStatus.ACTIVE,
                13L
        );
        when(subscriptionRepository.findByUserId(13L)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Subscription updated = subscriptionService.activateVip(13L, 30);

        assertEquals(LocalDate.now().plusDays(40), updated.getEndDate());
        verify(subscriptionRepository).save(any());
    }

    @Test
    void hasVipAccess_shouldReturnTrueOnlyForActiveAndNotExpiredVip() {
        Subscription validVip = new Subscription(
                2L,
                SubscriptionType.VIP,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(1),
                SubscriptionStatus.ACTIVE,
                14L
        );
        when(subscriptionRepository.findByUserId(14L)).thenReturn(Optional.of(validVip));
        when(subscriptionRepository.findByUserId(15L)).thenReturn(Optional.empty());

        assertTrue(subscriptionService.hasVipAccess(14L));
        assertFalse(subscriptionService.hasVipAccess(15L));
    }
}
