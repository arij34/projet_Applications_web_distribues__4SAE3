package com.smartfreelance.payment.controller.dto;

import jakarta.validation.constraints.*;

/**
 * Fake card input. We validate format only.
 */
public record PaySubscriptionRequest(
        @NotNull Long userId,
        @NotBlank String plan, // VIP
        @NotBlank @Pattern(regexp = "\\d{16}", message = "cardNumber must be 16 digits") String cardNumber,
        @NotBlank @Pattern(regexp = "(0[1-9]|1[0-2])\\/(\\d{2})", message = "expiry must be MM/YY") String expiry,
        @NotBlank @Pattern(regexp = "\\d{3}", message = "cvv must be 3 digits") String cvv,
        @NotBlank String cardHolderName
) {}
