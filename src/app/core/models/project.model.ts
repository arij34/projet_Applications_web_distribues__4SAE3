import { ProjectSkill } from './project-skill.model';

export interface Project {
  id?: number;
  title: string;
  description: string;
  deadline: string;
  status?: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  clientId: number;
  createdAt?: string;
  updatedAt?: string;
  skills?: ProjectSkill[];
  deleteRequested?: boolean;  // ← ajouté

}