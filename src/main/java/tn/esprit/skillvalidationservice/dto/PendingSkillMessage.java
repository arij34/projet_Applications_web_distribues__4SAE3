package tn.esprit.skillvalidationservice.dto;

import lombok.*;
import tn.esprit.skillvalidationservice.entity.Source;
import tn.esprit.skillvalidationservice.entity.Status;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PendingSkillMessage {

    private String suggestedName;
    private String normalizedName;
    private Long suggestedBy;
    private Source source;
    private Status status;
}