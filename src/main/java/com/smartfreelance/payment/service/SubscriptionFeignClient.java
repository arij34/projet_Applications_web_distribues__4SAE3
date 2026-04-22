package com.smartfreelance.payment.service;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.smartfreelance.payment.service.dto.ActivateVipRequest;
import com.smartfreelance.payment.service.dto.SubscriptionDto;

@FeignClient(name = "subscription-service")
public interface SubscriptionFeignClient {

    @PostMapping("/api/internal/subscriptions/activate-vip")
    SubscriptionDto activateVip(@RequestBody ActivateVipRequest request);
}