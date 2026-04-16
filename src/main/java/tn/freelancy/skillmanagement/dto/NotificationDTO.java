package tn.freelancy.skillmanagement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.freelancy.skillmanagement.entity.Notification;
import tn.freelancy.skillmanagement.entity.NotificationType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class NotificationDTO {

    private Long id;
    private NotificationType type;
    private String message;
    private String recipient;
    private String skillName;
    private Long freelancerId;
    private String freelancerName;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationDTO from(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setType(n.getType());
        dto.setMessage(n.getMessage());
        dto.setRecipient(n.getRecipient());
        dto.setSkillName(n.getSkillName());
        dto.setFreelancerId(n.getFreelancerId());
        dto.setFreelancerName(n.getFreelancerName());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}