export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ViolationType =
  | 'PHONE_DETECTED'
  | 'MULTIPLE_PEOPLE'
  | 'LOOKING_AWAY'
  | 'NO_FACE'
  | 'SUSPICIOUS_MOVEMENT'
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT';

export interface ProctoringViolation {
  examId: number;
  attemptId?: number | null;
  userId?: number;
  type: ViolationType;
  severity: ViolationSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface PhoneDetectionResult {
  detected: boolean;
  confidence: number;
}

export interface FaceDetectionResult {
  faceCount: number;
  multiplePeople: boolean;
  noFace: boolean;
}

export interface HeadPoseDetectionResult {
  facePresent: boolean;
  yaw: number;
  pitch: number;
  lookingAway: boolean;
  suspiciousMovement: boolean;
  noFaceDuration?: number;
}

export interface ViolationDTO {
  id?: number;
  examId: number;
  userId: number;
  type: string;
  timestamp: string;
  details?: string;
}

export type ProctoringAction = 'CONTINUE' | 'AUTO_SUBMIT' | 'TERMINATE_EXAM' | string;

export interface RecordViolationResponse {
  status?: 'WARNING' | 'TERMINATED' | 'AUTO_SUBMITTED' | string;
  violationCount?: number;
  message?: string;
  examSessionId?: number;
  action?: ProctoringAction;
}

export interface ProctoringViolationActionEvent {
  violation: ProctoringViolation;
  response: RecordViolationResponse;
}
