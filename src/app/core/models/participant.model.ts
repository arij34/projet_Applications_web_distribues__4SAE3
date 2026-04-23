export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledDate: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  status: 'Active' | 'Completed' | 'Dropped';
  lastActivity: string;
}

export interface ParticipantMetrics {
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  dropoffRate: number;
}

export interface CategoryPopularity {
  category: string;
  participants: number;
  challenges: number;
}

export interface TechnologyPopularity {
  technology: string;
  participants: number;
  avgCompletionRate: number;
}
