package tn.freelancy.skillmanagement.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer hoursPerDay;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "availability_days", joinColumns = @JoinColumn(name = "availability_id"))
    @Column(name = "day")
    private List<Days> selectedDays;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "availability_periods", joinColumns = @JoinColumn(name = "availability_id"))
    @Column(name = "period")
    private List<Periods> selectedPeriods;


    private Integer hoursPerWeek;
    private String status;
    Long userId;

    public Availability() {
    }

    public Long getId() {
        return id;
    }

    public Integer getHoursPerDay() {
        return hoursPerDay;
    }

    public void setHoursPerDay(Integer hoursPerDay) {
        this.hoursPerDay = hoursPerDay;
    }

    public List<Days> getSelectedDays() {
        return selectedDays;
    }

    public void setSelectedDays(List<Days> selectedDays) {
        this.selectedDays = selectedDays;
    }

    public List<Periods> getSelectedPeriods() {
        return selectedPeriods;
    }

    public void setSelectedPeriods(List<Periods> selectedPeriods) {
        this.selectedPeriods = selectedPeriods;
    }

    public Integer getHoursPerWeek() {
        return hoursPerWeek;
    }

    public void setHoursPerWeek(Integer hoursPerWeek) {
        this.hoursPerWeek = hoursPerWeek;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}

