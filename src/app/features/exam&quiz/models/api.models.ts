export interface ApiExam {
  id?: string | number;
  title: string;
  description?: string;
  points?: number | null;
  type?: 'Exam' | 'Quiz' | 'Practice';
  examType?: 'EXAM' | 'QUIZ' | 'PRACTICE' | 'Exam' | 'Quiz' | 'Practice';
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'Draft' | 'Active' | 'Archived';
  duration: number;
  totalMarks: number;
  passingScore?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  createdBy?: string;
  createdAt?: string;
  attempts?: number;
  maxAttempts?: number;
  showResult?: boolean;
  oneQuestionPerPage?: boolean;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
}

export interface ApiQuestion {
  id?: string | number;
  examId?: string | number;
  exam?: { id: string | number };
  examTitle?: string;
  questionText: string;
  type?: 'MCQ' | 'True/False' | 'Short';
  questionType?: 'MCQ' | 'TRUE_FALSE' | 'SHORT';
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD' | string;
  points: number;
  orderIndex?: number | null;
  timeLimit?: number | null;
}

export interface ApiAnswer {
  id?: string | number;
  questionId?: string | number;
  question?: { id: string | number };
  text?: string;
  answerText?: string;
  isCorrect: boolean;
  orderIndex?: number | null;
}

export interface ApiAttempt {
  id?: string | number;
  userName: string;
  userEmail: string;
  examTitle: string;
  status: 'In Progress' | 'Submitted' | 'Completed' | 'Flagged';
  score: number | null;
  totalMarks: number;
  startTime: string;
  endTime: string | null;
  duration: number;
  suspiciousEvents: number;
  tabSwitches: number;
}

export interface ApiCheatingLog {
  id?: string | number;
  attemptId: string | number;
  userName: string;
  examTitle: string;
  eventType:
    | 'TAB_SWITCH'
    | 'FULLSCREEN_EXIT'
    | 'COPY_PASTE'
    | 'WINDOW_BLUR'
    | 'MULTIPLE_LOGIN'
    | 'WEBCAM_DISABLED'
    | 'SUSPICIOUS_ACTIVITY';
  timestamp: string;
  details: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ApiExamSetting {
  id?: string | number;
  examId?: string | number;
  exam?: { id: string | number };
  oneQuestionPerPage?: boolean;
  requireFullscreen: boolean;
  preventTabSwitch: boolean;
  preventCopyPaste: boolean;
  webcamRequired: boolean;
  autoSubmitOnTabSwitch?: boolean;
  autoSubmitOnTabSwitchLimit?: boolean;
  tabSwitchLimit: number;
  ipRestriction: boolean;
  oneAttemptPerUser: boolean;
  deviceFingerprintRequired?: boolean;
  enableSecureSessionToken?: boolean;
  enableDeviceFingerprinting?: boolean;
  suspiciousScoreThreshold?: number;
  autoSubmitOnHighScore?: boolean;
  strictnessLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  detectScreenRecording?: boolean;
  detectVpnProxy?: boolean;
  minutesBetweenAttempts?: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  timedQuestions?: boolean;
  showTimer?: boolean;
  autoGrade: boolean;
  instantFeedback: boolean;
  browserLock?: boolean;
  practiceMode: boolean;
}
