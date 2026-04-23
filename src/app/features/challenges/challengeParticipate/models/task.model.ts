export interface Task {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export type FilterType = 'all' | 'remaining' | 'completed';
