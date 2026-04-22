package com.smartfreelance.subscription.controller;

import com.smartfreelance.subscription.model.SubscriptionStatus;
import com.smartfreelance.subscription.model.SubscriptionType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/public/subscriptions")
public class PublicSubscriptionMetaController {

    @GetMapping("/types")
    public List<SubscriptionType> types() {
        return Arrays.asList(SubscriptionType.values());
    }

    @GetMapping("/statuses")
    public List<SubscriptionStatus> statuses() {
        return Arrays.asList(SubscriptionStatus.values());
    }
}
