export interface FreelancerSkill {
  id?: number;
  skill?: { idS: number; name: string; category: string };
  skillId?: number;
  level: number;
  levelLabel?: string;
  yearsExperience: number;
  extractedByAI?: boolean;
  customSkillName?: string;


}