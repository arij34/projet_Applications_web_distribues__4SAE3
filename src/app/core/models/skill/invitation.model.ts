export interface InvitationProjectDTO {
  id: number;
  projectId: number;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;  matchScore: number;
  deadline: string;

  budgetMin: number;
  budgetMax: number;
  budgetRecommended: number;

  durationEstimatedWeeks: number;

  requiredSkills: string[];
  invitedAt: string;

  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TRASH'; // ✅ ajouter TRASH
  trashedAt?: string; 
}