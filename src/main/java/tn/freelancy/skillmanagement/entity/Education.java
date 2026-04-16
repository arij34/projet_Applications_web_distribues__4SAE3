package tn.freelancy.skillmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
public class Education {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING) // IMPORTANT
    @Column(nullable = false)
    private EducationDegree degree;

    @Column(nullable = false)
    private String fieldOfStudy;

    @Column(nullable = false)
    private String institution;

    @Column(nullable = false)
    private Integer year;


    private Boolean extractedByAI;

    Long userId;

    public Education() {

    }
    public Education( EducationDegree degree, String institution, Integer year, Boolean extractedByAI, Long userId) {
        this.degree = degree;
        this.institution = institution;
        this.year = year;
        this.extractedByAI = extractedByAI;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }





    public EducationDegree getDegree() {
        return degree;
    }

    public void setDegree(EducationDegree degree) {
        this.degree = degree;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Boolean getExtractedByAI() {
        return extractedByAI;
    }

    public void setExtractedByAI(Boolean extractedByAI) {
        this.extractedByAI = extractedByAI;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
