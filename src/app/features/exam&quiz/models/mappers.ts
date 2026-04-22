import { ApiAnswer, ApiAttempt, ApiCheatingLog, ApiExam, ApiExamSetting, ApiQuestion } from './api.models';
import { Attempt } from './attempt.model';
import { CheatingLog, EventType } from './cheating-log.model';
import { Exam, ExamFormData } from './exam.model';
import { Answer, Question, QuestionDetail } from './question.model';

const toStringId = (value: string | number | undefined): string => String(value ?? '');

export function mapApiExamToUi(exam: ApiExam): Exam {
  const apiType = (exam.examType ?? exam.type ?? 'EXAM').toString().toUpperCase();
  const typeMap: Record<string, Exam['type']> = {
    EXAM: 'Exam',
    QUIZ: 'Quiz',
    PRACTICE: 'Practice'
  };

  const apiStatus = (exam.status ?? 'DRAFT').toString().toUpperCase();
  const statusMap: Record<string, Exam['status']> = {
    DRAFT: 'Draft',
    PUBLISHED: 'Active',
    CLOSED: 'Archived',
    ACTIVE: 'Active',
    ARCHIVED: 'Archived'
  };

  return {
    id: toStringId(exam.id),
    title: exam.title ?? '',
    type: typeMap[apiType] ?? 'Exam',
    status: statusMap[apiStatus] ?? 'Draft',
    duration: Number(exam.duration ?? 0),
    totalMarks: Number(exam.totalMarks ?? 0),
    passingScore: exam.passingScore == null ? undefined : Number(exam.passingScore),
    createdBy: exam.createdBy ?? 'System',
    createdAt: exam.createdAt ?? new Date().toISOString(),
    attempts: Number(exam.attempts ?? 0),
    description: exam.description ?? '',
    maxAttempts: Number(exam.maxAttempts ?? 1),
    showResult: Boolean(exam.showResult ?? false)
  };
}

export function mapUiExamToApi(exam: Partial<Exam>): Partial<ApiExam> {
  const typeMap: Record<Exam['type'], 'EXAM' | 'QUIZ' | 'PRACTICE'> = {
    Exam: 'EXAM',
    Quiz: 'QUIZ',
    Practice: 'PRACTICE'
  };
  const statusMap: Record<Exam['status'], 'DRAFT' | 'PUBLISHED' | 'CLOSED'> = {
    Draft: 'DRAFT',
    Active: 'PUBLISHED',
    Archived: 'CLOSED'
  };

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    examType: exam.type ? typeMap[exam.type] : undefined,
    status: exam.status ? statusMap[exam.status] : undefined,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    createdBy: exam.createdBy,
    createdAt: exam.createdAt ? new Date(exam.createdAt).toISOString() : undefined,
    attempts: exam.attempts,
    maxAttempts: exam.maxAttempts,
    showResult: exam.showResult
  };
}

export function mapApiQuestionToUi(question: ApiQuestion, answers: ApiAnswer[] = []): Question {
  const correctAnswer = answers.find((answer) => answer.isCorrect)?.answerText
    ?? answers.find((answer) => answer.isCorrect)?.text
    ?? '';
  const questionTypeRaw = (question.questionType ?? question.type ?? 'MCQ').toString();
  const questionType: Question['type'] =
    questionTypeRaw === 'TRUE_FALSE' || questionTypeRaw === 'True/False'
      ? 'True/False'
      : questionTypeRaw === 'SHORT' || questionTypeRaw === 'Short'
        ? 'Short'
        : 'MCQ';
  return {
    id: toStringId(question.id),
    examTitle: question.examTitle ?? '',
    questionText: question.questionText ?? '',
    type: questionType,
    answers: answers.length,
    correctAnswer,
    points: Number(question.points ?? 0),
    timeLimit: question.timeLimit ?? undefined
  };
}

export function mapUiQuestionToApi(question: Partial<Question>, examId?: string): Partial<ApiQuestion> {
  const typeMap: Record<Question['type'], 'MCQ' | 'TRUE_FALSE' | 'SHORT'> = {
    MCQ: 'MCQ',
    'True/False': 'TRUE_FALSE',
    Short: 'SHORT'
  };

  return {
    id: question.id,
    examId,
    exam: examId ? { id: examId } : undefined,
    examTitle: question.examTitle,
    questionText: question.questionText,
    questionType: question.type ? typeMap[question.type] : undefined,
    points: question.points,
    timeLimit: question.timeLimit
  };
}

export function mapApiAttemptToUi(attempt: ApiAttempt): Attempt {
  return {
    id: toStringId(attempt.id),
    userName: attempt.userName ?? '',
    userEmail: attempt.userEmail ?? '',
    examTitle: attempt.examTitle ?? '',
    status: attempt.status ?? 'In Progress',
    score: attempt.score ?? null,
    totalMarks: Number(attempt.totalMarks ?? 0),
    startTime: attempt.startTime ?? '',
    endTime: attempt.endTime ?? null,
    duration: Number(attempt.duration ?? 0),
    suspiciousEvents: Number(attempt.suspiciousEvents ?? 0),
    tabSwitches: Number(attempt.tabSwitches ?? 0)
  };
}

export function mapUiAttemptToApi(attempt: Partial<Attempt>): Partial<ApiAttempt> {
  return {
    id: attempt.id,
    userName: attempt.userName,
    userEmail: attempt.userEmail,
    examTitle: attempt.examTitle,
    status: attempt.status,
    score: attempt.score ?? null,
    totalMarks: attempt.totalMarks,
    startTime: attempt.startTime ? new Date(attempt.startTime).toISOString() : undefined,
    endTime: attempt.endTime ? new Date(attempt.endTime).toISOString() : null,
    duration: attempt.duration,
    suspiciousEvents: attempt.suspiciousEvents,
    tabSwitches: attempt.tabSwitches
  };
}

export function mapApiCheatingLogToUi(log: ApiCheatingLog): CheatingLog {
  return {
    id: toStringId(log.id),
    attemptId: toStringId(log.attemptId),
    userName: log.userName ?? '',
    examTitle: log.examTitle ?? '',
    eventType: (log.eventType ?? 'SUSPICIOUS_ACTIVITY') as EventType,
    timestamp: log.timestamp ?? '',
    details: log.details ?? '',
    severity: log.severity ?? 'Low'
  };
}

export function mapUiCheatingLogToApi(log: Partial<CheatingLog>): Partial<ApiCheatingLog> {
  return {
    id: log.id,
    attemptId: log.attemptId,
    userName: log.userName,
    examTitle: log.examTitle,
    eventType: log.eventType,
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : undefined,
    details: log.details,
    severity: log.severity
  };
}

export function mapFormToExamCreateApi(form: ExamFormData): Partial<ApiExam> {
  const examTypeMap: Record<string, 'EXAM' | 'QUIZ' | 'PRACTICE'> = {
    Exam: 'EXAM',
    Quiz: 'QUIZ',
    Practice: 'PRACTICE'
  };

  return {
    title: form.title.trim(),
    description: form.description?.trim(),
    examType: examTypeMap[form.examType] ?? 'EXAM',
    status: 'DRAFT',
    duration: Number(form.duration),
    totalMarks: 100,
    passingScore: Number(form.passingScore),
    maxAttempts: Number(form.maxAttempts),
    showResult: form.showResult,
    createdAt: new Date().toISOString()
  };
}

export function mapFormToExamSettingCreateApi(form: ExamFormData, examId: string): ApiExamSetting {
  return {
    exam: { id: examId },
    oneQuestionPerPage: form.oneQuestionPerPage,
    requireFullscreen: form.requireFullscreen,
    preventTabSwitch: form.preventTabSwitch,
    preventCopyPaste: form.preventCopyPaste,
    webcamRequired: form.webcamRequired,
    autoSubmitOnTabSwitchLimit: form.autoSubmitOnTabSwitch,
    tabSwitchLimit: Number(form.tabSwitchLimit),
    ipRestriction: form.ipRestriction,
    oneAttemptPerUser: form.oneAttemptPerUser,
    deviceFingerprintRequired: form.deviceFingerprintRequired,
    enableSecureSessionToken: form.enableSecureSessionToken,
    enableDeviceFingerprinting: form.enableDeviceFingerprinting,
    suspiciousScoreThreshold: Number(form.suspiciousScoreThreshold),
    autoSubmitOnHighScore: form.autoSubmitOnHighScore,
    strictnessLevel: form.strictnessLevel,
    detectScreenRecording: form.detectScreenRecording,
    detectVpnProxy: form.detectVpnProxy,
    minutesBetweenAttempts: Number(form.minutesBetweenAttempts),
    randomizeQuestions: form.randomizeQuestions,
    randomizeAnswers: form.randomizeAnswers,
    showTimer: form.timedQuestions,
    autoGrade: form.autoGrade,
    instantFeedback: form.instantFeedback,
    browserLock: form.requireFullscreen,
    practiceMode: form.practiceMode
  };
}

export function mapQuestionDetailToQuestionApi(question: QuestionDetail, examId: string): ApiQuestion {
  const typeMap: Record<QuestionDetail['type'], 'MCQ' | 'TRUE_FALSE' | 'SHORT'> = {
    MCQ: 'MCQ',
    'True/False': 'TRUE_FALSE',
    Short: 'SHORT'
  };

  return {
    exam: { id: examId },
    questionText: question.text.trim(),
    questionType: typeMap[question.type],
    difficultyLevel: question.difficultyLevel,
    points: 1,
    timeLimit: question.timeLimit ?? null
  };
}

export function mapAnswerToApi(answer: Answer, questionId: string): ApiAnswer {
  return {
    question: { id: questionId },
    answerText: answer.text.trim(),
    isCorrect: answer.isCorrect,
    orderIndex: null
  };
}
