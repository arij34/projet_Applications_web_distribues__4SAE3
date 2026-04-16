package tn.freelancy.skillmanagement.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.dto.NotificationDTO;
import tn.freelancy.skillmanagement.entity.Notification;
import tn.freelancy.skillmanagement.entity.NotificationType;
import tn.freelancy.skillmanagement.repository.NotificationRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate      = messagingTemplate;
    }

    // ══════════════════════════════════════════════════════════════
    // CRÉER + ENVOYER une notification
    // ══════════════════════════════════════════════════════════════

    /**
     * Appelé depuis PendingSkillService quand un freelancer soumet un skill.
     * → Notifie l'admin en temps réel via WebSocket
     */
    public void notifyAdminNewPendingSkill(String skillName,
                                           Long freelancerId,
                                           String freelancerName) {

        String message = "🆕 New pending skill \"" + skillName
                + "\" submitted by " + freelancerName;

        Notification notif = new Notification(
                NotificationType.PENDING_SKILL_ADDED,
                message,
                "ADMIN",          // destinataire = admin
                skillName,
                freelancerId,
                freelancerName
        );

        Notification saved = notificationRepository.save(notif);

        // 🔥 Push WebSocket vers le topic admin
        messagingTemplate.convertAndSend(
                "/topic/admin-notifications",
                NotificationDTO.from(saved)
        );
    }

    /**
     * Appelé quand l'admin approuve un skill.
     * → Notifie le freelancer concerné
     */
    public void notifyFreelancerSkillApproved(String skillName,
                                              Long freelancerId,
                                              String freelancerName) {

        String message = "✅ Your skill \"" + skillName + "\" has been approved!";

        Notification notif = new Notification(
                NotificationType.SKILL_APPROVED,
                message,
                "USER_" + freelancerId,   // destinataire = ce freelancer
                skillName,
                freelancerId,
                freelancerName
        );

        Notification saved = notificationRepository.save(notif);

        // 🔥 Push WebSocket vers le topic de ce freelancer
        messagingTemplate.convertAndSend(
                "/topic/user-notifications/" + freelancerId,
                NotificationDTO.from(saved)
        );
    }

    /**
     * Appelé quand l'admin rejette un skill.
     */
    public void notifyFreelancerSkillRejected(String skillName,
                                              Long freelancerId,
                                              String freelancerName) {

        String message = "❌ Your skill \"" + skillName + "\" was not approved.";

        Notification notif = new Notification(
                NotificationType.SKILL_REJECTED,
                message,
                "USER_" + freelancerId,
                skillName,
                freelancerId,
                freelancerName
        );

        Notification saved = notificationRepository.save(notif);

        messagingTemplate.convertAndSend(
                "/topic/user-notifications/" + freelancerId,
                NotificationDTO.from(saved)
        );
    }

    // ══════════════════════════════════════════════════════════════
    // LECTURE
    // ══════════════════════════════════════════════════════════════

    public List<NotificationDTO> getAdminNotifications() {
        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc("ADMIN")
                .stream()
                .map(NotificationDTO::from)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc("USER_" + userId)
                .stream()
                .map(NotificationDTO::from)
                .collect(Collectors.toList());
    }

    public long getAdminUnreadCount() {
        return notificationRepository.countByRecipientAndReadFalse("ADMIN");
    }

    public long getUserUnreadCount(Long userId) {
        return notificationRepository.countByRecipientAndReadFalse("USER_" + userId);
    }

    // ══════════════════════════════════════════════════════════════
    // MARQUER COMME LU
    // ══════════════════════════════════════════════════════════════

    public void markAdminAllRead() {
        notificationRepository.markAllAsRead("ADMIN");
    }

    public void markUserAllRead(Long userId) {
        notificationRepository.markAllAsRead("USER_" + userId);
    }

    public void markOneAsRead(Long notifId) {
        notificationRepository.findById(notifId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}