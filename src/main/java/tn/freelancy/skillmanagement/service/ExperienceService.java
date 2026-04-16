package tn.freelancy.skillmanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.entity.Experience;
import tn.freelancy.skillmanagement.repository.ExperienceRepository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ExperienceService {

    @Autowired
    private ExperienceRepository experienceRepository;

    public Experience createExperience(Long userId, Experience experience) {
        experience.setUserId(userId);
        return experienceRepository.save(experience);
    }

    public List<Experience> getExperiencesByUserId(Long userId) {
        return experienceRepository.findByUserId(userId);
    }

    // 🔥 UPDATE sécurisé
    public Experience updateExperienceForUser(Long userId, Experience updatedExperience) {

        Experience existing = experienceRepository.findById(updatedExperience.getId())
                .orElseThrow(() -> new RuntimeException("Experience not found"));

        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        existing.setTitle(updatedExperience.getTitle());
        existing.setCompany(updatedExperience.getCompany());
        existing.setStartDate(updatedExperience.getStartDate());
        existing.setEndDate(updatedExperience.getEndDate());
        existing.setDescription(updatedExperience.getDescription());

        return experienceRepository.save(existing);
    }

    // 🔥 DELETE sécurisé
    public void deleteExperienceForUser(Long userId, Long id) {

        Experience existing = experienceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Experience not found"));

        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        experienceRepository.deleteById(id);
    }

    public double calculateTotalYearsByUser(Long userId) {
        List<Experience> experiences = experienceRepository.findByUserId(userId);

        long totalMonths = 0;
        for (Experience exp : experiences) {
            if (exp.getStartDate() != null) {
                LocalDate start = exp.getStartDate();
                LocalDate end = exp.getEndDate() != null ? exp.getEndDate() : LocalDate.now();
                totalMonths += ChronoUnit.MONTHS.between(start, end);
            }
        }
        return Math.round((totalMonths / 12.0) * 10.0) / 10.0;
    }


    public Experience getExperienceById(Long id) {
        return experienceRepository.findById(id).orElse(null);
    }
}