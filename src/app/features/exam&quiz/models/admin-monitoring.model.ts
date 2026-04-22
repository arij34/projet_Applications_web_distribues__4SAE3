export type MonitoringEventSource = 'VIOLATION' | 'CHEATING_LOG' | string;

export interface MonitoringEvent {
  source: MonitoringEventSource;
  examId: number;
  attemptId: number;
  userId: number;
  type: string;
  severity?: string | null;
  action?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface MonitoringCandidateSnapshot {
  attemptId: number;
  userId: number;
  attemptStatus?: string | null;
  startedAt?: string | null;
  expectedEndTime?: string | null;
  suspiciousScore?: number | null;
  answeredQuestions?: number | null;
  cheatingEventsCount?: number | null;
  violationCount?: number | null;
  lastWarningType?: string | null;
  lastWarningAction?: string | null;
  lastWarningTime?: string | null;
  lastActivityTime?: string | null;
  autoSubmitted?: boolean | null;
  recentEvents?: MonitoringEvent[] | null;
}

export interface ExamMonitoringSnapshot {
  examId: number;
  examTitle?: string | null;
  activeCandidates?: number | null;
  generatedAt?: string | null;
  candidates: MonitoringCandidateSnapshot[];
  recentEvents?: MonitoringEvent[] | null;
}

export interface AdminUserSummary {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}