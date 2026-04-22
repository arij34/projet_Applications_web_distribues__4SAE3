package tn.esprit.projet_module.entity;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")

public class Chatmessagedto {
    private Long projectId;
    private String senderName;
    private String senderRole;
    private String content;
    private LocalDateTime sentAt;
    private Long senderId;

    // ← constructeur vide OBLIGATOIRE pour la désérialisation JSON
    public Chatmessagedto() {}

    public Chatmessagedto(Long projectId, String senderName, String senderRole,
                          String content, LocalDateTime sentAt) {
        this.projectId  = projectId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.content    = content;
        this.sentAt     = sentAt;
    }

    public Long getProjectId()             { return projectId; }
    public void setProjectId(Long v)       { this.projectId = v; }

    public String getSenderName()          { return senderName; }
    public void setSenderName(String v)    { this.senderName = v; }

    public String getSenderRole()          { return senderRole; }
    public void setSenderRole(String v)    { this.senderRole = v; }

    public String getContent()             { return content; }
    public void setContent(String v)       { this.content = v; }

    public LocalDateTime getSentAt()       { return sentAt; }
    public void setSentAt(LocalDateTime v) { this.sentAt = v; }
    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }



}



