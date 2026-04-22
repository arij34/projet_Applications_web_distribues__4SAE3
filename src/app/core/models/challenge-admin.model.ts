export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ChallengeStatus = 'Active' | 'InProgress' | 'Completed' | 'Closed';

export interface TodoItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ChallengeForm {
  title: string;
  description: string;
  technology: string;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  maxParticipants: number;
  startDate?: string;
  endDate?: string;
  image?: string;
  githubUrl?: string;
  points: number;
  todoItems: TodoItem[];
}
