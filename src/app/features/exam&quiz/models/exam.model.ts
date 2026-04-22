export interface Exam {
  id: string;
  title: string;
  type: 'Exam' | 'Quiz' | 'Practice';
  status: 'Draft' | 'Active' | 'Archived';
  duration: number;
  totalMarks: number;
  passingScore?: number;
  createdBy: string;
  createdAt: string;
  attempts: number;
  description?: string;
  maxAttempts?: number;
  showResult?: boolean;
}

export interface ExamFormData {
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  examType: string;
  maxAttempts: number;
  showResult: boolean;
  oneQuestionPerPage: boolean;
  requireFullscreen: boolean;
  preventTabSwitch: boolean;
  preventCopyPaste: boolean;
  webcamRequired: boolean;
  autoSubmitOnTabSwitch: boolean;
  tabSwitchLimit: number;
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
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  timedQuestions: boolean;
  autoGrade: boolean;
  instantFeedback: boolean;
  practiceMode: boolean;
}