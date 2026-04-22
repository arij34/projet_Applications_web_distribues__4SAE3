export interface Attempt {
  id: string;
  userName: string;
  userEmail: string;
  examTitle: string;
  status: 'Completed' | 'In Progress' | 'Submitted' | 'Flagged';
  score: number | null;
  totalMarks: number;
  startTime: string;
  endTime: string | null;
  duration: number;
  suspiciousEvents: number;
  tabSwitches: number;
}
