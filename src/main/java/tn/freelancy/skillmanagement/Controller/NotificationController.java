package tn.freelancy.skillmanagement.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.freelancy.skillmanagement.clients.UserDto;
import tn.freelancy.skillmanagement.clients.UserServiceClient;
import tn.freelancy.skillmanagement.dto.NotificationDTO;
import tn.freelancy.skillmanagement.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserServiceClient userServiceClient;

    public NotificationController(NotificationService notificationService,
                                  UserServiceClient userServiceClient) {
        this.notificationService = notificationService;
        this.userServiceClient = userServiceClient;
    }

    // ── ADMIN ──────────────────────────────────────────────────────

    /** Toutes les notifs admin */
    @GetMapping("/admin")
    public ResponseEntity<List<NotificationDTO>> getAdminNotifications() {
        return ResponseEntity.ok(notificationService.getAdminNotifications());
    }

    /** Badge compteur non lu admin */
    @GetMapping("/admin/unread-count")
    public ResponseEntity<Map<String, Long>> getAdminUnreadCount() {
        return ResponseEntity.ok(
                Map.of("count", notificationService.getAdminUnreadCount())
        );
    }

    /** Marquer toutes les notifs admin comme lues */
    @PutMapping("/admin/mark-all-read")
    public ResponseEntity<Void> markAdminAllRead() {
        notificationService.markAdminAllRead();
        return ResponseEntity.ok().build();
    }

    // ── FREELANCER (frontoffice) ───────────────────────────────────

    /** Toutes les notifs du freelancer courant */
    @GetMapping("/user/me")
    public ResponseEntity<List<NotificationDTO>> getUserNotificationsForCurrentUser(
            @RequestHeader("Authorization") String authorization) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Long userId = currentUser.getId();
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    /** Badge compteur non lu freelancer courant */
    @GetMapping("/user/me/unread-count")
    public ResponseEntity<Map<String, Long>> getUserUnreadCountForCurrentUser(
            @RequestHeader("Authorization") String authorization) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Long userId = currentUser.getId();
        return ResponseEntity.ok(
                Map.of("count", notificationService.getUserUnreadCount(userId))
        );
    }

    /** Marquer toutes les notifs du freelancer courant comme lues */
    @PutMapping("/user/me/mark-all-read")
    public ResponseEntity<Void> markUserAllReadForCurrentUser(
            @RequestHeader("Authorization") String authorization) {

        UserDto currentUser = userServiceClient.getCurrentUser(authorization);
        Long userId = currentUser.getId();
        notificationService.markUserAllRead(userId);
        return ResponseEntity.ok().build();
    }

    // ── COMMUN ────────────────────────────────────────────────────

    /** Marquer une notification précise comme lue */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markOneAsRead(@PathVariable Long id) {
        notificationService.markOneAsRead(id);
        return ResponseEntity.ok().build();
    }
}