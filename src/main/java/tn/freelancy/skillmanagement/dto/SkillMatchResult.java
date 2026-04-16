package tn.freelancy.skillmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.freelancy.skillmanagement.entity.Skill;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SkillMatchResult {

    private Skill skillName; // ✅ au lieu de Skill
    private double confidence;
    private boolean exactMatch;
    private boolean suggestion;
}