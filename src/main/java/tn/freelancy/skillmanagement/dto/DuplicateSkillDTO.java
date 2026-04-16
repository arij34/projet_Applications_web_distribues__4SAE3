package tn.freelancy.skillmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DuplicateSkillDTO {

    private String skillA;
    private String skillB;
    private double confidence;
}