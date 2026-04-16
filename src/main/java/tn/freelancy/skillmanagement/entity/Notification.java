package tn.freelancy.skillmanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "skill_notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private String recipient;

    private String skillName;

    private Long freelancerId;

    private String freelancerName;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(NotificationType type, String message,
                        String recipient, String skillName,
                        Long freelancerId, String freelancerName) {
        this.type           = type;
        this.message        = message;
        this.recipient      = recipient;
        this.skillName      = skillName;
        this.freelancerId   = freelancerId;
        this.freelancerName = freelancerName;
        this.createdAt      = LocalDateTime.now();
        this.read           = false;
    }

    public Long getId()                      { return id; }
    public NotificationType getType()        { return type; }
    public void setType(NotificationType t)  { this.type = t; }
    public String getMessage()               { return message; }
    public void setMessage(String m)         { this.message = m; }
    public String getRecipient()             { return recipient; }
    public void setRecipient(String r)       { this.recipient = r; }
    public String getSkillName()             { return skillName; }
    public void setSkillName(String s)       { this.skillName = s; }
    public Long getFreelancerId()            { return freelancerId; }
    public void setFreelancerId(Long id)     { this.freelancerId = id; }
    public String getFreelancerName()        { return freelancerName; }
    public void setFreelancerName(String n)  { this.freelancerName = n; }
    public boolean isRead()                  { return read; }
    public void setRead(boolean r)           { this.read = r; }
    public LocalDateTime getCreatedAt()      { return createdAt; }
    public void setCreatedAt(LocalDateTime d){ this.createdAt = d; }
}