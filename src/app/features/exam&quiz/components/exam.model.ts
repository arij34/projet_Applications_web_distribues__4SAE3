export type ExamStatus = 'draft' | 'published' | 'archived';
export type ExamType = 'final' | 'midterm' | 'quiz' | 'practice';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  maxAttempts: number;
  createdBy: string;
  createdAt: Date;
  status: ExamStatus;
  type: ExamType;
  showResult: boolean;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  points: number;
}

export interface AntiCheatConfig {
  requireFullscreen: boolean;
  preventCopyPaste: boolean;
  preventTabSwitch: boolean;
  autoSubmitOnTabSwitch: boolean;
  requireWebcam: boolean;
  ipRestriction: boolean;
  oneAttemptPerUser: boolean;
  deviceFingerprintRequired: boolean;
  enableSecureSessionToken: boolean;
  enableDeviceFingerprinting: boolean;
  suspiciousScoreThreshold: number;
  autoSubmitOnHighScore: boolean;
  strictnessLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  detectScreenRecording: boolean;
  detectVpnProxy: boolean;
  minutesBetweenAttempts: number;
}
