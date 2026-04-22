export interface MatchingResult {
  id: number;
  freelancerId: number;
  projectId: number;

  scoreFinal: number;

  // ✅ Scores détaillés (optionnels pour éviter erreurs Angular)
  scoreSkills?: number;
  scoreAvailability?: number;
  scoreExperience?: number;
  scoreEducation?: number;
  scoreChallenges?: number;

  status: string;

  // ✅ Champs ajoutés pour le front (enrichissement)
  projectTitle?: string;
  projectDeadline?: string;
}