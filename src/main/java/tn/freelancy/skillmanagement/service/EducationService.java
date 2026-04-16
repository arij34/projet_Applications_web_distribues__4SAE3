package tn.freelancy.skillmanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.freelancy.skillmanagement.entity.Education;
import tn.freelancy.skillmanagement.repository.EducationRepository;

import java.util.List;

@Service
public class EducationService {

    @Autowired
    private EducationRepository educationRepository;

    // ✅ SUPPRIMÉ : UserRepository userRepository (n'existe plus)

    public Education createEducation(Long userId, Education education) {
        // ✅ CORRIGÉ : on stocke directement le userId
        education.setUserId(userId);
        return educationRepository.save(education);
    }

    public List<Education> getAllEducations() {
        return educationRepository.findAll();
    }

    public Education getEducationById(Long id) {
        return educationRepository.findById(id).orElse(null);
    }

    // ✅ AJOUTÉ : toutes les formations d'un utilisateur (appelé par GET /user/me)
    public List<Education> getEducationsByUserId(Long userId) {
        return educationRepository.findByUserId(userId);
    }

    public Education updateEducation(Education updatedEducation) {
        return educationRepository.save(updatedEducation);
    }

    public void deleteEducation(Long id) {
        educationRepository.deleteById(id);
    }

    // ✅ CORRIGÉ : méthode repository renommée pour utiliser userId (Long)
    //              au lieu de User_Id (relation JPA vers entité User supprimée)
    public Education getLatestEducation(Long userId) {
        return educationRepository.findTopByUserIdOrderByYearDesc(userId);
    }
}