package tn.freelancy.skillmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;
@Entity
@Getter
@Setter
@AllArgsConstructor
public class Experience {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;


        private String title;

        private String company;

    private LocalDate startDate;

    private LocalDate endDate;

        @Column(columnDefinition = "TEXT")
        private String description;

        private Boolean extractedByAI;
    Long userId;

    public Experience() {

    }

    public Experience( String title, String company, LocalDate startDate, LocalDate endDate, String description, Boolean extractedByAI) {
        this.title = title;
        this.company = company;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
        this.extractedByAI = extractedByAI;
    }

    public Long getId() {
        return id;
    }




    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }



    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
