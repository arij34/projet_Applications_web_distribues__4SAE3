package tn.freelancy.skillmanagement.entity;

public enum NotificationType {
    PENDING_SKILL_ADDED,   // Freelancer a soumis un skill → notif admin
    SKILL_APPROVED,        // Admin a approuvé → notif freelancer
    SKILL_REJECTED         // Admin a rejeté  → notif freelancer
}