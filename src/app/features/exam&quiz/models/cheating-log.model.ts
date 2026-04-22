export type EventType = 
  | 'TAB_SWITCH' 
  | 'FULLSCREEN_EXIT' 
  | 'COPY_PASTE' 
  | 'WINDOW_BLUR' 
  | 'MULTIPLE_LOGIN'
  | 'WEBCAM_DISABLED'
  | 'SUSPICIOUS_ACTIVITY';

export interface CheatingLog {
  id: string;
  attemptId: string;
  userName: string;
  examTitle: string;
  eventType: EventType;
  timestamp: string;
  details: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface CheatingStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}
