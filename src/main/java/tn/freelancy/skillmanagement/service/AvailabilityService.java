package tn.freelancy.skillmanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.freelancy.skillmanagement.entity.Availability;
import tn.freelancy.skillmanagement.entity.Days;
import tn.freelancy.skillmanagement.entity.Periods;
import tn.freelancy.skillmanagement.repository.AvailabilityRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AvailabilityService {

    @Autowired
    private AvailabilityRepository availabilityRepository;

    // ✅ SUPPRIMÉ : UserRepository userRepository (n'existe plus)

    // ── Calculs ──────────────────────────────────────────────────────────────

    private int computeMaxHoursPerDay(List<Periods> periods) {
        if (periods == null || periods.isEmpty()) return 0;
        if (periods.contains(Periods.ALL_DAY)) return 24;
        return periods.size() * 6;
    }

    private int computeHoursPerWeek(int hoursPerDay, List<Days> days) {
        if (days == null || days.isEmpty()) return 0;
        return hoursPerDay * days.size();
    }

    private String computeStatus(int hoursPerWeek, List<Periods> periods) {
        if (hoursPerWeek == 0 || periods == null || periods.isEmpty()) return "UNAVAILABLE";
        String base = hoursPerWeek < 20 ? "PART_TIME" : "AVAILABLE";
        String periodStr = periods.stream()
                .map(Enum::name).sorted().collect(Collectors.joining("_"));
        return base + "_" + periodStr;
    }

    private void applyCalculations(Availability availability) {
        int hoursPerDay = availability.getHoursPerDay() != null ? availability.getHoursPerDay() : 0;
        List<Days>    days    = availability.getSelectedDays();
        List<Periods> periods = availability.getSelectedPeriods();

        int max = computeMaxHoursPerDay(periods);
        if (hoursPerDay > max) hoursPerDay = max;
        availability.setHoursPerDay(hoursPerDay);

        int hoursPerWeek = computeHoursPerWeek(hoursPerDay, days);
        availability.setHoursPerWeek(hoursPerWeek);
        availability.setStatus(computeStatus(hoursPerWeek, periods));
    }

    // ── Preview (sans sauvegarde) ─────────────────────────────────────────────
    public Availability calculatePreview(Availability availability) {
        applyCalculations(availability);
        return availability;
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public Availability createAvailability(Long userId, Availability availability) {
        // ✅ CORRIGÉ : plus besoin de chercher un User en BDD
        //              on stocke directement le userId dans l'entité
        availability.setUserId(userId);
        applyCalculations(availability);
        return availabilityRepository.save(availability);
    }

    // ✅ AJOUTÉ : méthode appelée par GET /user/me dans le controller
    public Availability getAvailabilityByUserId(Long userId) {
        return availabilityRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Availability not found for user: " + userId));
    }

    public Availability updateAvailability(Long id, Availability incoming) {
        Availability existing = availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Availability not found: " + id));
        existing.setHoursPerDay(incoming.getHoursPerDay());
        existing.setSelectedDays(incoming.getSelectedDays());
        existing.setSelectedPeriods(incoming.getSelectedPeriods());
        applyCalculations(existing);
        return availabilityRepository.save(existing);
    }

    public List<Availability> getAllAvailabilities() {
        return availabilityRepository.findAll();
    }

    public Availability getAvailabilityById(Long id) {
        return availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Availability not found: " + id));
    }

    public void deleteAvailability(Long id) {
        availabilityRepository.deleteById(id);
    }
}