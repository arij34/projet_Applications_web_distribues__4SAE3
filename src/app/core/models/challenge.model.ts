// src/app/core/models/challenge.model.ts

/** Task from API (backend entity) */
export interface ChallengeTask {
  id?: string;
  idTask?: string;
  title: string;
  description?: string;
  status?: string;
  deadline?: string | Date;
  submittedAt?: string | Date;
}

/** Challenge entity used for list/detail views and API responses */
export interface Challenge {
  id: string;
  title: string;
  description?: string;
  category?: string;
  technology?: string | string[];
  startDate?: Date;
  endDate?: Date;
  difficulty?: string;
  status?: string;
  maxParticipants?: number;
  points?: number;
  participants?: number;
  progress?: number;
  githubUrl?: string;
  image?: string;
  tasks?: ChallengeTask[];
  createdAt?: Date;
  updatedAt?: Date;
}

/** Challenge detail extends Challenge with extra fields */
export interface ChallengeDetail extends Challenge {
  requirements?: unknown[];
  resources?: unknown[];
  submissions?: number;
  tasks?: ChallengeTask[];
}

export interface Step {
  id: number;
  title: string;
}

export interface ChallengeInfo {
  title: string;
  description: string;
  category: string;
  technologies: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | '';
  image: string | null;
}

export interface GitHubChecklist {
  orgCreated: boolean;
  repoCreated: boolean;
  readmeAdded: boolean;
  forkEnabled: boolean;
}

export interface GitHubData {
  repositoryUrl: string;
  checklist: GitHubChecklist;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  order: number;
}

export interface SettingsData {
  startDate: string;
  endDate: string;
  maxParticipants: string;
  points: string;
  status: 'draft' | 'published' | 'closed' | '';
}

export interface ChallengeFormData {
  challengeInfo: ChallengeInfo;
  githubData: GitHubData;
  tasks: Task[];
  settings: SettingsData;
}

export const STEPS: Step[] = [
  { id: 1, title: 'Challenge Information' },
  { id: 2, title: 'GitHub Preparation' },
  { id: 3, title: 'Tasks Creation' },
  { id: 4, title: 'Settings & Limits' },
  { id: 5, title: 'Review & Publish' }
];

export const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Machine Learning',
  'DevOps',
  'Data Science',
  'Blockchain'
];

export const TECH_OPTIONS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'Docker',
  'Kubernetes',
  'GraphQL',
  'PostgreSQL'
];
