package com.smartfreelance.payment.service;

import com.smartfreelance.payment.service.dto.SubscriptionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.Map;

@Component
public class SubscriptionClient {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String subscriptionBaseUrl;

    public SubscriptionClient(@Value("${app.services.subscription.base-url}") String subscriptionBaseUrl) {
        this.subscriptionBaseUrl = subscriptionBaseUrl;
    }

    public SubscriptionDto activateVip(Long userId, int days) {
        String url = subscriptionBaseUrl + "/api/internal/subscriptions/activate-vip";
        Map<String, Object> body = Map.of(
                "userId", userId,
                "days", days
        );
        ResponseEntity<SubscriptionDto> res = restTemplate.postForEntity(url, body, SubscriptionDto.class);
        return res.getBody();
    }
}
