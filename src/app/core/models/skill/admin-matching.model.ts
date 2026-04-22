export interface AdminMatchingRow {
  id: number;
  projectId: number;
  freelancerId: number;
  scoreSkills: number;
  scoreExperience: number;
  scoreEducation: number;
  scoreAvailability: number;
  scoreFinal: number;
  status: string;
}