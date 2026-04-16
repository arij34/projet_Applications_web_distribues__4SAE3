package tn.freelancy.skillmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
public class PendingSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String suggestedName;

    private String normalizedName;

    private Long suggestedBy;

    @Enumerated(EnumType.STRING)
    private Source source;

    @Enumerated(EnumType.STRING)
    private Status status;

    public PendingSkill() {
    }

    public PendingSkill( String suggestedName, String normalizedName, Long suggestedBy, Source source, Status status) {
        this.suggestedName = suggestedName;
        this.normalizedName = normalizedName;
        this.suggestedBy = suggestedBy;
        this.source = source;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getSuggestedName() {
        return suggestedName;
    }

    public String getNormalizedName() {
        return normalizedName;
    }

    public Long getSuggestedBy() {
        return suggestedBy;
    }

    public Source getSource() {
        return source;
    }

    public Status getStatus() {
        return status;
    }

    public void setSuggestedName(String suggestedName) {
        this.suggestedName = suggestedName;
    }

    public void setNormalizedName(String normalizedName) {
        this.normalizedName = normalizedName;
    }

    public void setSuggestedBy(Long suggestedBy) {
        this.suggestedBy = suggestedBy;
    }

    public void setSource(Source source) {
        this.source = source;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
