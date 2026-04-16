package tn.freelancy.skillmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tn.freelancy.skillmanagement.entity.Notification;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Toutes les notifs d'un destinataire, triées par date DESC
    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient);

    // Notifs non lues d'un destinataire
    List<Notification> findByRecipientAndReadFalseOrderByCreatedAtDesc(String recipient);

    // Compteur non lu
    long countByRecipientAndReadFalse(String recipient);

    // Marquer toutes comme lues pour un destinataire
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient AND n.read = false")
    void markAllAsRead(String recipient);
}