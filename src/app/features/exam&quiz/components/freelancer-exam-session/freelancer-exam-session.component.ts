import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, firstValueFrom, forkJoin, from, map, of, switchMap, interval, Subscription, Observable } from 'rxjs';
import { ApiAnswer, ApiQuestion } from '../../models/api.models';
import { ExamService } from '../../services/exam.service';
import { QuestionService } from '../../services/question.service';
import { AntiCheatingService, ExamSessionConfig } from '../../services/anti-cheating.service';
import { ViolationService } from '../../services/violation.service';
import { ExamSessionService } from '../../services/exam-session.service';
import { ResultService } from '../../services/result.service';
import { MeService } from '../../../../core/services/me.service';
import { environment } from '../../../../../environments/environment';
import { FullscreenEnforcementComponent } from '../fullscreen-enforcement/fullscreen-enforcement.component';
import { CheatingWarningComponent } from '../cheating-warning/cheating-warning.component';
import { WebcamMonitorComponent } from '../webcam-monitor/webcam-monitor.component';
import { ProctoringViolation, ProctoringViolationActionEvent, ViolationDTO } from '../../models/proctoring.model';

export type SessionQuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT';

export interface SessionAnswer {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface SessionQuestion {
  id: string;
  number: number;
  text: string;
  type: SessionQuestionType;
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  answers: SessionAnswer[];
}

interface StoredQuestionResult {
  id: string;
  number: number;
  text: string;
  points: number;
  earnedPoints: number;
  status: 'correct' | 'wrong' | 'partial' | 'skipped';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yourAnswer?: string;
  correctAnswer?: string;
}

interface StoredExamResultSnapshot {
  examId: string;
  examTitle: string;
  passingScore: number;
  timeTaken: string;
  submittedAt: string;
  results: StoredQuestionResult[];
}

interface ProctoringWarningLog {
  label: string;
  message: string;
  attemptsLeft: number | null;
  timestamp: string;
  createdAtMs: number;
}

interface ApiDebugEntry {
  ts: string;
  phase: 'RESULT_CHECK' | 'SESSION_START' | 'SESSION_SUBMIT' | 'SESSION_AUTO_SUBMIT';
  method: 'GET' | 'POST';
  endpoint: string;
  status: number | 'network' | 'unknown';
  message: string;
  request?: unknown;
  response?: unknown;
}

interface StoredExamSessionContext {
  attemptId: number | null;
  sessionToken: string | null;
}

@Component({
  selector: 'app-freelancer-exam-session',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FullscreenEnforcementComponent, CheatingWarningComponent, WebcamMonitorComponent],
  templateUrl: './freelancer-exam-session.component.html',
  styleUrls: ['./freelancer-exam-session.component.scss'],
})
export class FreelancerExamSessionComponent implements OnInit, OnDestroy {
  readonly lookingAwayMaxWarnings = 3;
  readonly tabSwitchMaxAttempts = 3;
  readonly phoneDetectionMaxAttempts = 2;

  private readonly fallbackQuestion: SessionQuestion = {
    id: 'placeholder-question',
    number: 1,
    text: 'Loading question...',
    type: 'MCQ',
    points: 0,
    difficulty: 'EASY',
    answers: []
  };

  examTitle = signal('Exam Session');
  questions = signal<SessionQuestion[]>([]);
  currentIndex = signal(0);
  answers = signal<Record<string, string>>({});
  timeLeftSeconds = signal(60 * 60);
  isSubmitConfirmOpen = signal(false);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  // Anti-cheating signals
  showFullscreenEnforcement = signal(true);
  hasEnteredFullscreen = signal(false);
  suspiciousScore = signal(0);
  showCheatingWarning = signal(false);
  cheatingWarningTitle = '';
  cheatingWarningMessage = '';
  cheatingWarningSeverity: 'low' | 'medium' | 'high' = 'medium';
  forcedSubmissionTitle = 'Exam Submission Required';
  forcedSubmissionMessage = '';
  forcedSubmissionActionLabel = 'Submit Now';
  forcedSubmissionMode: 'submit' | 'acknowledge' = 'submit';
  forcedSubmissionCountdown = signal(5);
  showForcedSubmissionModal = signal(false);
  warningLogs = signal<ProctoringWarningLog[]>([]);
  warningLogsNewest = computed(() =>
    [...this.warningLogs()].sort((a, b) => b.createdAtMs - a.createdAtMs)
  );
  showApiDebugPanel = signal(false);
  apiDebugLogs = signal<ApiDebugEntry[]>([]);
  passingScore = 70;
  attemptId: number | null = null;
  sessionToken: string | null = null;
  examId: number | null = null;
  
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private lastAnswerTime: Record<string, number> = {};
  private suspiciousScoreSubscription: Subscription | null = null;
  private hasTerminationTriggered = false;
  private isSubmitting = false;
  // Incremental score updates are disabled: POST /api/results/submit is the sole
  // source of truth for score calculation and XP awarding, preventing double-counting.
  private readonly increaseScoreEndpointAvailable = false;
  private readonly scoredQuestionIds = new Set<string>();
  private readonly scoringInFlightQuestionIds = new Set<string>();
  lookingAwayWarningCount = signal(0);
  private tabSwitchWarningCount = 0;
  private phoneDetectionWarningCount = 0;
  private sessionStartTime = 0;
  private initialDurationSeconds = 60 * 60;
  private forcedSubmissionTimer: ReturnType<typeof setTimeout> | null = null;
  private forcedSubmissionCountdownTimer: ReturnType<typeof setInterval> | null = null;
  private participationStatusPollInterval: ReturnType<typeof setInterval> | null = null;
  private adminBlockNoticeShown = false;

  currentUserId: number | null = null;
  private redirectedToResult = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly examService: ExamService,
    private readonly questionService: QuestionService,
    private readonly antiCheatingService: AntiCheatingService,
    private readonly violationService: ViolationService,
    private readonly examSessionService: ExamSessionService,
    private readonly resultService: ResultService,
    private readonly meService: MeService,
  ) {}

  ngOnInit(): void {
    this.loadSessionData();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.suspiciousScoreSubscription) {
      this.suspiciousScoreSubscription.unsubscribe();
      this.suspiciousScoreSubscription = null;
    }
    this.clearForcedSubmissionTimers();
    this.stopParticipationStatusMonitor();
    this.antiCheatingService.stopExamMonitoring();
  }

  private loadSessionData(): void {
    const examId = this.route.snapshot.paramMap.get('id');
    if (!examId) {
      this.loadError.set('Missing exam id in route.');
      this.isLoading.set(false);
      this.startTimer();
      return;
    }

    this.examId = Number(examId);
    this.redirectedToResult = false;
    this.adminBlockNoticeShown = false;
    this.stopParticipationStatusMonitor();
    this.isLoading.set(true);
    this.loadError.set(null);

    from(this.meService.me()).pipe(
      catchError(() => of({ id: 0, firstName: '', lastName: '', email: '', enabled: false })),
      switchMap((meDto) => {
        this.currentUserId = meDto.id || null;

        const violations$ = this.currentUserId
          ? this.violationService.getViolations(this.examId!, this.currentUserId).pipe(catchError(() => of([] as ViolationDTO[])))
          : of([] as ViolationDTO[]);

        const result$ = this.currentUserId
          ? this.resultService.getMyHistory(this.currentUserId).pipe(
              map((items) => items.find((item) => Number(item.examId) === Number(this.examId)) ?? null),
              catchError((error) => {
                this.pushApiDebug({
                  phase: 'RESULT_CHECK',
                  method: 'GET',
                  endpoint: '/api/results/history/me',
                  status: this.getErrorStatus(error),
                  message: 'Failed to check existing result before starting exam.',
                  request: { userId: this.currentUserId, examId: this.examId },
                  response: this.getErrorResponse(error)
                });
                return of(null);
              })
            )
          : of(null);

        return forkJoin({
          exam: this.examService.getExamById(examId).pipe(catchError(() => of(null))),
          questions: this.questionService.getQuestionsByExamId(examId).pipe(catchError(() => of([] as ApiQuestion[]))),
          violations: violations$,
          result: result$
        });
      }),
      switchMap(({ exam, questions, violations, result }) => {
        if (result) {
          this.redirectedToResult = true;
          this.router.navigate(['/exams', examId, 'result']);
          return of([] as SessionQuestion[]);
        }

        this.restoreViolationCounts(violations);

        if (exam) {
          this.examTitle.set(exam.title || 'Exam Session');
          const durationMinutes = Number(exam.duration ?? 60);
          this.passingScore = Number(exam.passingScore ?? 70);
          this.initialDurationSeconds = Math.max(60, durationMinutes * 60);
          this.timeLeftSeconds.set(this.initialDurationSeconds);
        }

        if (questions.length === 0) {
          return of([] as SessionQuestion[]);
        }

        const sortedQuestions = [...questions].sort((a, b) => {
          const aOrder = Number(a.orderIndex ?? Number.MAX_SAFE_INTEGER);
          const bOrder = Number(b.orderIndex ?? Number.MAX_SAFE_INTEGER);
          if (aOrder !== bOrder) return aOrder - bOrder;
          return Number(a.id ?? 0) - Number(b.id ?? 0);
        });

        const mappedQuestions$ = sortedQuestions.map((question, index) =>
          this.questionService.getAnswersByQuestionId(String(question.id ?? '')).pipe(
            map((questionAnswers) => this.mapApiQuestionToSession(question, questionAnswers, index + 1)),
            catchError(() => of(this.mapApiQuestionToSession(question, [], index + 1)))
          )
        );

        return forkJoin(mappedQuestions$);
      }),
      catchError((error) => {
        console.error('Failed to load real exam session data', error);
        this.loadError.set('Failed to load exam data. Please try again.');
        return of([] as SessionQuestion[]);
      }),
      finalize(() => {
        if (this.redirectedToResult) {
          return;
        }

        this.isLoading.set(false);
        this.startTimer();
        this.startAutoSave();
        this.setupSuspiciousScoreMonitoring();
        this.startParticipationStatusMonitor();
      })
    ).subscribe((items) => {
      this.questions.set(items);
      this.answers.set({});
      this.scoredQuestionIds.clear();
      this.scoringInFlightQuestionIds.clear();
      this.currentIndex.set(0);
    });
  }

  private restoreViolationCounts(violations: ViolationDTO[]): void {
    const lookingAwayCount = violations.filter(v => v.type === 'LOOKING_AWAY').length;
    const tabSwitchCount = violations.filter(v => v.type === 'TAB_SWITCH').length;
    const phoneCount = violations.filter(v => v.type === 'PHONE_DETECTED').length;

    if (lookingAwayCount > 0) this.lookingAwayWarningCount.set(lookingAwayCount);
    if (tabSwitchCount > 0) this.tabSwitchWarningCount = tabSwitchCount;
    if (phoneCount > 0) this.phoneDetectionWarningCount = phoneCount;
  }

  private mapApiQuestionToSession(apiQuestion: ApiQuestion, apiAnswers: ApiAnswer[], fallbackNumber: number): SessionQuestion {
    const rawType = String(apiQuestion.questionType ?? apiQuestion.type ?? 'MCQ').toUpperCase().replace('-', '_').replace(' ', '_');
    const type: SessionQuestionType =
      rawType.includes('TRUE') ? 'TRUE_FALSE' :
      rawType.includes('SHORT') ? 'SHORT' :
      'MCQ';

    const difficultyRaw = String(apiQuestion.difficultyLevel ?? 'EASY').toUpperCase();
    const difficulty: 'EASY' | 'MEDIUM' | 'HARD' =
      difficultyRaw === 'HARD' ? 'HARD' :
      difficultyRaw === 'MEDIUM' ? 'MEDIUM' :
      'EASY';

    const numberFromOrder = Number(apiQuestion.orderIndex ?? fallbackNumber);
    const answers = apiAnswers
      .sort((a, b) => Number(a.orderIndex ?? Number.MAX_SAFE_INTEGER) - Number(b.orderIndex ?? Number.MAX_SAFE_INTEGER))
      .map((answer) => ({
        id: String(answer.id ?? ''),
        text: this.normalizeAnswerLabel(String(answer.answerText ?? answer.text ?? '').trim()),
        isCorrect: Boolean(answer.isCorrect),
      }))
      .filter((answer) => answer.id.length > 0 && answer.text.length > 0);

    return {
      id: String(apiQuestion.id ?? `q-${fallbackNumber}`),
      number: Number.isFinite(numberFromOrder) && numberFromOrder > 0 ? numberFromOrder : fallbackNumber,
      text: String(apiQuestion.questionText ?? '').trim() || 'Question text unavailable.',
      type,
      points: Number(apiQuestion.points ?? 0),
      difficulty,
      answers,
    };
  }

  private normalizeAnswerLabel(text: string): string {
    // Convert labels like "Option A: ..." to "A: ..." for a cleaner exam UI.
    return text.replace(/^Option\s+([A-E])\s*:\s*/i, '$1: ');
  }

  private startTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const t = this.timeLeftSeconds();
      if (t <= 1) {
        this.timeLeftSeconds.set(0);
        this.submitExamOnTimerExpiry();
      } else {
        this.timeLeftSeconds.set(t - 1);
      }
    }, 1000);
  }

  currentQuestion = computed(() => this.questions()[this.currentIndex()] ?? this.fallbackQuestion);

  progress = computed(() => {
    const total = this.questions().length;
    if (total === 0) return 0;
    const answered = Object.keys(this.answers()).filter(k => (this.answers()[k] ?? '').trim() !== '').length;
    return Math.round((answered / total) * 100);
  });

  liveEarnedPoints = computed(() =>
    this.buildQuestionResults().reduce((sum, item) => sum + Number(item.earnedPoints ?? 0), 0)
  );

  liveScorePercent = computed(() => {
    const total = this.maxPoints;
    if (total <= 0) return 0;
    return Math.round((this.liveEarnedPoints() / total) * 100);
  });

  isAnswered(questionId: string): boolean {
    return !!(this.answers()[questionId]?.trim());
  }

  selectAnswer(questionId: string, answerId: string): void {
    this.answers.update(prev => ({ ...prev, [questionId]: answerId }));
  }

  get shortAnswerText(): string {
    return this.answers()[this.currentQuestion().id] ?? '';
  }
  set shortAnswerText(val: string) {
    const id = this.currentQuestion().id;
    this.answers.update(prev => ({ ...prev, [id]: val }));
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.questions().length) {
      this.currentIndex.set(index);
    }
  }

  next(): void {
    this.goTo(this.currentIndex() + 1);
  }
  prev(): void { this.goTo(this.currentIndex() - 1); }

  private tryAwardScoreForCurrentQuestion(): void {
    if (!this.currentUserId || !this.examId || !this.increaseScoreEndpointAvailable) {
      return;
    }

    const question = this.currentQuestion();
    if (!question || question.type === 'SHORT') {
      return;
    }

    const questionId = String(question.id);
    if (this.scoredQuestionIds.has(questionId) || this.scoringInFlightQuestionIds.has(questionId)) {
      return;
    }

    const selectedAnswerId = (this.answers()[questionId] ?? '').trim();
    if (!selectedAnswerId) {
      return;
    }

    const selectedAnswer = question.answers.find((answer) => answer.id === selectedAnswerId);
    const isCorrect = Boolean(selectedAnswer?.isCorrect);
    const deltaPoints = Number(question.points ?? 0);
    if (!isCorrect || deltaPoints <= 0) {
      return;
    }

    this.scoringInFlightQuestionIds.add(questionId);
    this.resultService.increaseScore(this.currentUserId, this.examId, deltaPoints).pipe(
      finalize(() => this.scoringInFlightQuestionIds.delete(questionId)),
      catchError((error) => {
        console.error('Failed to increase score for question', error);
        return of(null);
      })
    ).subscribe((response) => {
      if (response !== null) {
        this.scoredQuestionIds.add(questionId);
      }
    });
  }

  get answeredCount(): number {
    return Object.keys(this.answers()).filter(k => (this.answers()[k] ?? '').trim() !== '').length;
  }

  get unansweredCount(): number {
    return Math.max(this.questions().length - this.answeredCount, 0);
  }

  get maxPoints(): number {
    return this.questions().reduce((sum, q) => sum + q.points, 0);
  }

  get timerDisplay(): string {
    const secs = this.timeLeftSeconds();
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  get timerUrgent(): boolean {
    return this.timeLeftSeconds() < 300;
  }

  openSubmitConfirm(): void { this.isSubmitConfirmOpen.set(true); }
  cancelSubmit(): void { this.isSubmitConfirmOpen.set(false); }

  submitExam(): void {
    this.isSubmitConfirmOpen.set(false);

    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;

    if (this.examId && (!this.attemptId || !this.sessionToken)) {
      const restored = this.readStoredSessionContext(this.examId);
      if (restored?.attemptId && restored.attemptId > 0) {
        this.attemptId = restored.attemptId;
      }
      if (restored?.sessionToken && restored.sessionToken.length > 0) {
        this.sessionToken = restored.sessionToken;
      }
    }

    const examId = this.route.snapshot.paramMap.get('id') ?? '10';
    this.resolveSessionContextForSubmit().subscribe((resolved) => {
      if (!resolved) {
        this.pushApiDebug({
          phase: 'SESSION_SUBMIT',
          method: 'GET',
          endpoint: '/api/exam-participations/my/exam/{examId}',
          status: 'unknown',
          message: 'Unable to resolve attempt/session context before submit; continuing with backend fallback.',
          request: { examId: this.examId, userId: this.currentUserId }
        });
      }

      this.submitExamWithResolvedContext(examId);
    });
  }

  private submitExamWithResolvedContext(examId: string): void {

    this.stopParticipationStatusMonitor();

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.suspiciousScoreSubscription) {
      this.suspiciousScoreSubscription.unsubscribe();
      this.suspiciousScoreSubscription = null;
    }
    this.clearForcedSubmissionTimers();
    this.showForcedSubmissionModal.set(false);
    this.antiCheatingService.stopExamMonitoring();

    this.persistLocalResultFallback();

    if (!this.examId || !this.currentUserId) {
      this.pushApiDebug({
        phase: 'SESSION_SUBMIT',
        method: 'POST',
        endpoint: '/api/exam-sessions/submit',
        status: 'unknown',
        message: 'Skipped backend submit because required exam/user context is missing.',
        request: {
          attemptId: this.attemptId,
          sessionTokenPresent: Boolean(this.sessionToken),
          examId: this.examId,
          userId: this.currentUserId
        }
      });
      this.loadError.set('Missing exam context (examId/userId). Please restart the exam from the preview page.');
      alert('Cannot submit: missing exam context. Please restart the exam from preview.');
      this.isSubmitting = false;
      return;
    }

    const submitPayload = {
      attemptId: this.attemptId,
      userId: this.currentUserId,
      examId: this.examId,
      answers: this.buildSubmissionAnswersMap(),
      sessionToken: this.sessionToken ?? '',
      ipAddress: this.antiCheatingService.getCurrentIpAddress() ?? '',
      deviceFingerprint: this.antiCheatingService.getDeviceFingerprintString() ?? '',
      timeTakenSeconds: Math.max(this.initialDurationSeconds - this.timeLeftSeconds(), 0),
      cheatingEvents: this.antiCheatingService.getCheatingEvents(),
      autoSubmitted: this.hasTerminationTriggered
    };

    this.examSessionService.submit(submitPayload).pipe(
      catchError((error) => {
        console.error('Failed to submit exam session', error);
        this.pushApiDebug({
          phase: 'SESSION_SUBMIT',
          method: 'POST',
          endpoint: '/api/exam-sessions/submit',
          status: this.getErrorStatus(error),
          message: 'Backend submit failed; local fallback result will be used.',
          request: {
            ...submitPayload,
            sessionToken: submitPayload.sessionToken ? '***' : null,
            answersCount: Object.keys(submitPayload.answers).length
          },
          response: this.getErrorResponse(error)
        });
        return of(null);
      })
    ).subscribe((result) => {
      if (result === null) {
        this.loadError.set('Backend submission failed. Showing local result fallback.');
        alert('Submit failed on backend. Please retry.');
        this.isSubmitting = false;
        return;
      }

      this.pushApiDebug({
        phase: 'SESSION_SUBMIT',
        method: 'POST',
        endpoint: '/api/exam-sessions/submit',
        status: 200,
        message: 'Backend submit succeeded.'
      });
      this.markExamAsCompleted(examId);
      this.isSubmitting = false;
      this.router.navigate(['/exams', examId, 'result']);
    });
  }

  private resolveSessionContextForSubmit(): Observable<boolean> {
    if (this.attemptId && this.attemptId > 0 && this.sessionToken && this.sessionToken.length > 0) {
      return of(true);
    }

    if (!this.examId) {
      return of(false);
    }

    const endpoint = `${environment.apiBaseUrl}/api/exam-participations/my/exam/${this.examId}`;
    return this.http.get<unknown>(endpoint).pipe(
      map((response) => {
        const resolved = this.extractSessionContext(response);
        if (!resolved.attemptId || !resolved.sessionToken) {
          return null;
        }

        this.attemptId = resolved.attemptId;
        this.sessionToken = resolved.sessionToken;
        window.sessionStorage.setItem(this.getSessionStorageKey(this.examId ?? ''), JSON.stringify(resolved));
        return true;
      }),
      catchError(() => of(null)),
      switchMap((resolved) => {
        if (resolved === true) {
          return of(true);
        }

        if (!this.examId || !this.currentUserId) {
          return of(false);
        }

        return this.examSessionService.start({
          examId: this.examId,
          userId: this.currentUserId,
          ipAddress: this.antiCheatingService.getCurrentIpAddress() ?? '127.0.0.1',
          deviceFingerprint: this.antiCheatingService.getDeviceFingerprintString() || 'browser-fingerprint-unavailable',
          browserInfo: navigator.userAgent || 'unknown-browser'
        }).pipe(
          map((startResponse) => {
            const attemptId = Number(startResponse?.attemptId ?? 0);
            const sessionToken = String(startResponse?.sessionToken ?? '').trim();
            if (!Number.isFinite(attemptId) || attemptId <= 0 || sessionToken.length === 0) {
              return false;
            }

            this.attemptId = attemptId;
            this.sessionToken = sessionToken;
            window.sessionStorage.setItem(
              this.getSessionStorageKey(this.examId ?? ''),
              JSON.stringify({ attemptId, sessionToken })
            );
            return true;
          }),
          catchError(() => of(false))
        );
      })
    );
  }

  private extractSessionContext(payload: unknown): StoredExamSessionContext {
    const obj = (payload ?? {}) as Record<string, unknown>;
    const attemptObj = (obj['attempt'] ?? {}) as Record<string, unknown>;

    const attemptId = Number(
      obj['attemptId'] ??
      obj['participationId'] ??
      attemptObj['id'] ??
      0
    );

    const sessionTokenRaw =
      obj['sessionToken'] ??
      obj['token'] ??
      attemptObj['sessionToken'] ??
      attemptObj['token'] ??
      '';

    const sessionToken = String(sessionTokenRaw).trim();

    return {
      attemptId: Number.isFinite(attemptId) && attemptId > 0 ? attemptId : null,
      sessionToken: sessionToken.length > 0 ? sessionToken : null,
    };
  }

  private submitExamOnTimerExpiry(): void {
    this.stopParticipationStatusMonitor();

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.suspiciousScoreSubscription) {
      this.suspiciousScoreSubscription.unsubscribe();
      this.suspiciousScoreSubscription = null;
    }
    this.clearForcedSubmissionTimers();
    this.showForcedSubmissionModal.set(false);
    this.antiCheatingService.stopExamMonitoring();

    const examId = this.route.snapshot.paramMap.get('id') ?? '10';
    this.persistLocalResultFallback();

    if (!this.attemptId) {
      this.pushApiDebug({
        phase: 'SESSION_AUTO_SUBMIT',
        method: 'POST',
        endpoint: '/api/exam-sessions/auto-submit/{attemptId}',
        status: 'unknown',
        message: 'Timer expired but attemptId is missing; backend auto-submit skipped.'
      });
      this.router.navigate(['/exams', examId, 'result']);
      return;
    }

    this.examSessionService.autoSubmit(this.attemptId).pipe(
      catchError((error) => {
        this.pushApiDebug({
          phase: 'SESSION_AUTO_SUBMIT',
          method: 'POST',
          endpoint: '/api/exam-sessions/auto-submit/{attemptId}',
          status: this.getErrorStatus(error),
          message: 'Backend timer auto-submit failed; local fallback result will be used.',
          request: { attemptId: this.attemptId },
          response: this.getErrorResponse(error)
        });
        return of(null);
      })
    ).subscribe((result) => {
      if (result !== null) {
        this.pushApiDebug({
          phase: 'SESSION_AUTO_SUBMIT',
          method: 'POST',
          endpoint: '/api/exam-sessions/auto-submit/{attemptId}',
          status: 200,
          message: 'Timer auto-submit succeeded.'
        });
        this.markExamAsCompleted(examId);
      }

      this.router.navigate(['/exams', examId, 'result']);
    });
  }

  private markExamAsCompleted(examId: string): void {
    this.examService.updateExam(examId, { status: 'CLOSED' }).pipe(
      catchError((error) => {
        console.error('Failed to mark exam as completed', error);
        return of(null);
      })
    ).subscribe();
  }

  // Anti-cheating handlers

  /**
   * Handle fullscreen enforcement confirmation
   */
  async onFullscreenConfirmed(): Promise<void> {
    this.hasEnteredFullscreen.set(true);
    this.showFullscreenEnforcement.set(false);
    await this.initializeAntiCheatingSession();
  }

  /**
   * Handle fullscreen enforcement decline
   */
  onFullscreenDeclined(): void {
    alert('Exam requires fullscreen mode to proceed. Exiting to exam list.');
    this.router.navigate(['/exams']);
  }

  /**
   * Initialize anti-cheating session after fullscreen entered
   */
  private async initializeAntiCheatingSession(): Promise<void> {
    if (!this.examId || !this.currentUserId) {
      this.loadError.set('Unable to start session: missing exam or user context.');
      return;
    }

    const contextReady = await this.ensureExamSessionContext();
    if (!contextReady) {
      this.loadError.set('Unable to initialize exam attempt/session context for proctoring.');
      return;
    }

    const storedContext = this.readStoredSessionContext(this.examId);
    const resolvedAttemptId = Number(storedContext?.attemptId ?? this.attemptId ?? 0);
    const resolvedSessionToken = String(storedContext?.sessionToken ?? this.sessionToken ?? '').trim();

    const config: ExamSessionConfig = {
      attemptId: Number.isFinite(resolvedAttemptId) && resolvedAttemptId > 0 ? resolvedAttemptId : 0,
      sessionToken: resolvedSessionToken,
      examId: this.examId || 0,
      userId: this.currentUserId ?? 0,
      durationMinutes: Number(this.timeLeftSeconds() / 60),
      startTime: Date.now(),
      expectedEndTime: Date.now() + (this.timeLeftSeconds() * 1000)
    };

    this.attemptId = config.attemptId;
    this.sessionToken = config.sessionToken;
    this.sessionStartTime = Date.now();
    this.antiCheatingService.startExamSession(config);
  }

  private async ensureExamSessionContext(): Promise<boolean> {
    if (this.attemptId && this.attemptId > 0 && this.sessionToken && this.sessionToken.trim().length > 0) {
      return true;
    }

    if (!this.examId || !this.currentUserId) {
      return false;
    }

    const ipAddress = this.antiCheatingService.getCurrentIpAddress() ?? '127.0.0.1';
    const deviceFingerprint = this.antiCheatingService.getDeviceFingerprintString() || 'browser-fingerprint-unavailable';

    try {
      const started = await firstValueFrom(this.examSessionService.start({
        examId: this.examId,
        userId: this.currentUserId,
        ipAddress,
        deviceFingerprint,
        browserInfo: navigator.userAgent || 'unknown-browser'
      }));

      const attemptId = Number(started?.attemptId ?? 0);
      const sessionToken = String(started?.sessionToken ?? '').trim();
      if (!Number.isFinite(attemptId) || attemptId <= 0 || sessionToken.length === 0) {
        return false;
      }

      this.attemptId = attemptId;
      this.sessionToken = sessionToken;
      window.sessionStorage.setItem(
        this.getSessionStorageKey(this.examId),
        JSON.stringify({ attemptId, sessionToken })
      );
      return true;
    } catch (error) {
      console.error('Failed to initialize backend exam session context', error);
      return false;
    }
  }

  private readStoredSessionContext(examId: number): StoredExamSessionContext | null {
    const raw = window.sessionStorage.getItem(this.getSessionStorageKey(examId));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredExamSessionContext>;
      return {
        attemptId: Number(parsed.attemptId ?? 0) || null,
        sessionToken: parsed.sessionToken ? String(parsed.sessionToken) : null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Start auto-save of answers every 5 seconds
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      const currentAttemptId = this.attemptId;
      if (!currentAttemptId) {
        return;
      }

      const answers = this.answers();
      const elapsed = Math.max(this.initialDurationSeconds - this.timeLeftSeconds(), 0);

      Object.entries(answers).forEach(([questionId, rawAnswer]) => {
        const trimmed = (rawAnswer ?? '').trim();
        if (!trimmed) {
          return;
        }

        if (this.lastAnswerTime[questionId] === elapsed) {
          return;
        }

        const answerText = this.resolveAnswerText(questionId, trimmed);
        const parsedQuestionId = Number(questionId);
        if (!Number.isFinite(parsedQuestionId)) {
          return;
        }

        this.antiCheatingService.saveAnswer(currentAttemptId, parsedQuestionId, answerText, elapsed).pipe(
          catchError((error) => {
            console.error('Auto-save answer failed', error);
            return of(null);
          })
        ).subscribe();

        this.lastAnswerTime[questionId] = elapsed;
      });
    }, 5000);
  }

  /**
   * Monitor suspicious activity score
   */
  private setupSuspiciousScoreMonitoring(): void {
    if (this.suspiciousScoreSubscription) {
      this.suspiciousScoreSubscription.unsubscribe();
    }

    // Check suspicious score every 2 seconds
    this.suspiciousScoreSubscription = interval(2000).subscribe(() => {
      const currentScore = this.antiCheatingService.getSuspiciousScore();
      this.suspiciousScore.set(currentScore);

      if (this.hasTerminationTriggered) {
        return;
      }

      // 15-second grace period: ignore violations that happened right at session
      // start (fullscreen transition, browser focus changes, etc.)
      const sessionAgeMs = Date.now() - this.sessionStartTime;
      if (sessionAgeMs < 15000) {
        return;
      }

      // Show warning if score is high
      if (currentScore > 8 && currentScore < 12) {
        this.showWarning(
          'Multiple Suspicious Activities Detected',
          'Your exam session shows signs of suspicious activity. Multiple violations may result in exam termination.',
          'high'
        );
      } else if (currentScore > 12) {
        // Backend action is the source of truth for exam termination.
        this.showWarning(
          'High Suspicious Activity Score',
          'Suspicious activity is very high. Proctoring events have been reported and backend policy will decide whether to terminate the exam.',
          'high'
        );
      }
    });
  }

  /**
   * Show cheating warning
   */
  private showWarning(title: string, message: string, severity: 'low' | 'medium' | 'high'): void {
    this.cheatingWarningTitle = title;
    this.cheatingWarningMessage = message;
    this.cheatingWarningSeverity = severity;
    this.showCheatingWarning.set(true);

    // Auto-hide warning after 8 seconds
    setTimeout(() => {
      this.showCheatingWarning.set(false);
    }, 8000);
  }

  /**
   * Handle warning closed
   */
  onWarningClosed(): void {
    this.showCheatingWarning.set(false);
  }

  /**
   * Handle warning dismissed
   */
  onWarningDismissed(): void {
    this.showCheatingWarning.set(false);
  }

  onProctoringViolation(violation: ProctoringViolation): void {
    if (this.hasTerminationTriggered) {
      return;
    }

    const severityMap: Record<ProctoringViolation['severity'], 'low' | 'medium' | 'high'> = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'high'
    };

    if (violation.type === 'MULTIPLE_PEOPLE') {
      this.addWarningLog('Multiple people detected', violation.message, 0);
      this.openForcedSubmissionModal(violation);
      return;
    }

    if (violation.type === 'LOOKING_AWAY') {
      this.lookingAwayWarningCount.update((count) => count + 1);
      const attemptsLeft = Math.max(
        this.lookingAwayMaxWarnings - this.lookingAwayWarningCount(),
        0
      );
      this.addWarningLog('Face not focused on screen', violation.message, attemptsLeft);

      if (attemptsLeft <= 0) {
        this.openForcedSubmissionModal(violation, {
          title: 'Exam Submission Required',
          message: 'You reached the maximum number of face-focus warnings. Your exam will now be submitted automatically.'
        });
        return;
      }

      const attemptLabel = attemptsLeft === 1 ? 'attempt' : 'attempts';
      this.showWarning(
        'Proctoring Alert',
        `Warning: Please keep your face focused on the screen. Backend policy will enforce violations. Current local count: ${this.lookingAwayWarningCount()} (${attemptsLeft} ${attemptLabel} left based on configured UI limit).`,
        severityMap[violation.severity]
      );
      return;
    }

    if (violation.type === 'TAB_SWITCH') {
      this.tabSwitchWarningCount += 1;
      const attemptsLeft = Math.max(this.tabSwitchMaxAttempts - this.tabSwitchWarningCount, 0);
      this.addWarningLog('Tab switching', violation.message, attemptsLeft);

      if (attemptsLeft <= 0) {
        this.openForcedSubmissionModal(violation, {
          title: 'Exam Submission Required',
          message: 'You reached the maximum number of tab-switch warnings. Your exam will now be submitted automatically.'
        });
        return;
      }

      const attemptLabel = attemptsLeft === 1 ? 'attempt' : 'attempts';
      this.showWarning(
        'Proctoring Alert',
        `${violation.message} Backend policy will enforce violations. Current local count: ${this.tabSwitchWarningCount} (${attemptsLeft} ${attemptLabel} left based on configured UI limit).`,
        severityMap[violation.severity]
      );
      return;
    }

    if (violation.type === 'PHONE_DETECTED') {
      this.phoneDetectionWarningCount += 1;
      const attemptsLeft = Math.max(this.phoneDetectionMaxAttempts - this.phoneDetectionWarningCount, 0);
      this.addWarningLog('Phone detected', violation.message, attemptsLeft);

      if (attemptsLeft <= 0) {
        this.openForcedSubmissionModal(violation, {
          title: 'Exam Submission Required',
          message: 'Phone was detected too many times. Your exam will now be submitted automatically.'
        });
        return;
      }

      const attemptLabel = attemptsLeft === 1 ? 'attempt' : 'attempts';
      this.showWarning(
        'Proctoring Alert',
        `${violation.message} Backend policy will enforce violations. Current local count: ${this.phoneDetectionWarningCount} (${attemptsLeft} ${attemptLabel} left based on configured UI limit).`,
        severityMap[violation.severity]
      );
      return;
    }

    this.addWarningLog(this.getViolationLabel(violation.type), violation.message, null);

    this.showWarning('Proctoring Alert', violation.message, severityMap[violation.severity]);

    // Backend response action is authoritative for forced termination/submission.
  }

  onBackendProctoringAction(event: ProctoringViolationActionEvent): void {
    if (this.hasTerminationTriggered) {
      return;
    }

    const action = String(event.response.action ?? '').toUpperCase();
    if (action !== 'AUTO_SUBMIT' && action !== 'TERMINATE_EXAM') {
      return;
    }

    const backendMessage = event.response.message?.trim();
    this.openForcedSubmissionModal(event.violation, {
      title: action === 'TERMINATE_EXAM' ? 'Exam Terminated' : 'Exam Submission Required',
      message: backendMessage && backendMessage.length > 0
        ? backendMessage
        : 'Your exam has been terminated by proctoring policy and will be submitted automatically.'
    });
  }

  confirmForcedSubmission(): void {
    if (this.forcedSubmissionMode === 'acknowledge') {
      this.showForcedSubmissionModal.set(false);
      this.navigateToResultPage();
      return;
    }

    this.submitExam();
  }

  private openForcedSubmissionModal(
    violation: ProctoringViolation,
    options?: { title?: string; message?: string }
  ): void {
    if (this.showForcedSubmissionModal() || this.hasTerminationTriggered) {
      return;
    }

    this.hasTerminationTriggered = true;

    const detectedCount = Number(violation.metadata?.['faceCount'] ?? 2);
    const faceLabel = detectedCount > 1 ? `${detectedCount} faces were` : 'an additional face was';
    const defaultMessage = `Proctoring detected that ${faceLabel} present in the camera view. In accordance with the exam rules, your session will be submitted automatically.`;

    this.forcedSubmissionTitle = options?.title ?? 'Exam Submission Required';
    this.forcedSubmissionMessage = options?.message ?? defaultMessage;
    this.forcedSubmissionMode = 'submit';
    this.forcedSubmissionActionLabel = 'Submit Now';
    this.forcedSubmissionCountdown.set(5);
    this.showForcedSubmissionModal.set(true);
    this.showCheatingWarning.set(false);

    this.forcedSubmissionCountdownTimer = setInterval(() => {
      const nextValue = this.forcedSubmissionCountdown() - 1;
      this.forcedSubmissionCountdown.set(Math.max(nextValue, 0));
    }, 1000);

    this.forcedSubmissionTimer = setTimeout(() => {
      this.submitExam();
    }, 5000);
  }

  private startParticipationStatusMonitor(): void {
    if (this.participationStatusPollInterval !== null || !this.examId) {
      return;
    }

    const check = () => this.checkParticipationStatusForExternalBlock();
    check();
    this.participationStatusPollInterval = setInterval(check, 5000);
  }

  private stopParticipationStatusMonitor(): void {
    if (this.participationStatusPollInterval) {
      clearInterval(this.participationStatusPollInterval);
      this.participationStatusPollInterval = null;
    }
  }

  private checkParticipationStatusForExternalBlock(): void {
    if (!this.examId || this.adminBlockNoticeShown || this.redirectedToResult || this.isSubmitting) {
      return;
    }

    const endpoint = `${environment.apiBaseUrl}/api/exam-participations/my/exam/${this.examId}`;
    this.http.get<unknown>(endpoint).pipe(
      catchError(() => of(null))
    ).subscribe((payload) => {
      if (!payload || this.adminBlockNoticeShown || this.redirectedToResult) {
        return;
      }

      const obj = payload as Record<string, unknown>;
      const attemptObj = (obj['attempt'] ?? {}) as Record<string, unknown>;
      const status = String(obj['status'] ?? obj['attemptStatus'] ?? attemptObj['status'] ?? '').toUpperCase();
      const autoSubmitted = Boolean(obj['autoSubmitted'] ?? attemptObj['autoSubmitted'] ?? false);

      if ((status.includes('SUBMIT') || status.includes('FINISH')) && autoSubmitted) {
        this.showAdminBlockedByProctorNotice();
      }
    });
  }

  private showAdminBlockedByProctorNotice(): void {
    if (this.adminBlockNoticeShown) {
      return;
    }

    this.adminBlockNoticeShown = true;
    this.hasTerminationTriggered = true;
    this.stopParticipationStatusMonitor();

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.suspiciousScoreSubscription) {
      this.suspiciousScoreSubscription.unsubscribe();
      this.suspiciousScoreSubscription = null;
    }
    this.clearForcedSubmissionTimers();
    this.antiCheatingService.stopExamMonitoring();

    this.forcedSubmissionTitle = 'Exam Access Blocked';
    this.forcedSubmissionMessage = 'You are blocked from this exam by the admin for suspicious behaviours. Your attempt has been submitted automatically.';
    this.forcedSubmissionMode = 'acknowledge';
    this.forcedSubmissionActionLabel = 'OK';
    this.forcedSubmissionCountdown.set(0);
    this.showForcedSubmissionModal.set(true);
    this.showCheatingWarning.set(false);
  }

  private navigateToResultPage(): void {
    const examId = this.route.snapshot.paramMap.get('id') ?? String(this.examId ?? '10');
    this.router.navigate(['/exams', examId, 'result']);
  }

  private clearForcedSubmissionTimers(): void {
    if (this.forcedSubmissionTimer) {
      clearTimeout(this.forcedSubmissionTimer);
      this.forcedSubmissionTimer = null;
    }

    if (this.forcedSubmissionCountdownTimer) {
      clearInterval(this.forcedSubmissionCountdownTimer);
      this.forcedSubmissionCountdownTimer = null;
    }
  }

  private addWarningLog(label: string, message: string, attemptsLeft: number | null): void {
    const now = Date.now();
    this.warningLogs.update((logs) => {
      const nextLog: ProctoringWarningLog = {
        label,
        message,
        attemptsLeft,
        timestamp: this.formatWarningTimestamp(now),
        createdAtMs: now
      };

      return [nextLog, ...logs].slice(0, 8);
    });
  }

  private formatWarningTimestamp(epochMs: number): string {
    return new Date(epochMs).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  private getViolationLabel(type: ProctoringViolation['type']): string {
    switch (type) {
      case 'PHONE_DETECTED':
        return 'Phone detected';
      case 'NO_FACE':
        return 'No face detected';
      case 'SUSPICIOUS_MOVEMENT':
        return 'Suspicious movement';
      case 'TAB_SWITCH':
        return 'Tab switching';
      case 'FULLSCREEN_EXIT':
        return 'Fullscreen exited';
      default:
        return 'Proctoring warning';
    }
  }

  private buildSubmissionAnswersMap(): Record<string, string> {
    const answers = this.answers();
    const out: Record<string, string> = {};

    Object.entries(answers).forEach(([questionId, rawAnswer]) => {
      const parsedQuestionId = Number(questionId);
      const trimmed = (rawAnswer ?? '').trim();
      if (!Number.isFinite(parsedQuestionId) || !trimmed) {
        return;
      }

      out[String(parsedQuestionId)] = this.resolveAnswerText(questionId, trimmed);
    });

    return out;
  }

  private resolveAnswerText(questionId: string, selectedValue: string): string {
    const question = this.questions().find((item) => item.id === questionId);
    if (!question || question.type === 'SHORT') {
      return selectedValue;
    }

    const selectedAnswer = question.answers.find((answer) => answer.id === selectedValue);
    return selectedAnswer?.text ?? selectedValue;
  }

  private persistLocalResultFallback(): void {
    if (this.examId === null) {
      return;
    }

    const snapshot: StoredExamResultSnapshot = {
      examId: String(this.examId),
      examTitle: this.examTitle(),
      passingScore: this.passingScore,
      timeTaken: this.formatTimeTaken(Math.max(this.initialDurationSeconds - this.timeLeftSeconds(), 0)),
      submittedAt: new Date().toISOString(),
      results: this.buildQuestionResults()
    };

    window.localStorage.setItem(this.getResultStorageKey(String(this.examId)), JSON.stringify(snapshot));
  }

  private buildQuestionResults(): StoredQuestionResult[] {
    const answers = this.answers();

    return this.questions().map((question) => {
      const rawAnswer = (answers[question.id] ?? '').trim();

      if (!rawAnswer) {
        return {
          id: question.id,
          number: question.number,
          text: question.text,
          points: question.points,
          earnedPoints: 0,
          status: 'skipped',
          difficulty: question.difficulty
        };
      }

      if (question.type === 'SHORT') {
        return {
          id: question.id,
          number: question.number,
          text: question.text,
          points: question.points,
          earnedPoints: 0,
          status: 'partial',
          difficulty: question.difficulty,
          yourAnswer: rawAnswer
        };
      }

      const selectedAnswer = question.answers.find((answer) => answer.id === rawAnswer);
      const correctAnswers = question.answers.filter((answer) => answer.isCorrect);
      const isCorrect = Boolean(selectedAnswer?.isCorrect);

      return {
        id: question.id,
        number: question.number,
        text: question.text,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0,
        status: isCorrect ? 'correct' : 'wrong',
        difficulty: question.difficulty,
        yourAnswer: selectedAnswer?.text ?? rawAnswer,
        correctAnswer: correctAnswers.map((answer) => answer.text).join(', ') || undefined
      };
    });
  }

  private formatTimeTaken(totalSeconds: number): string {
    const clamped = Math.max(0, totalSeconds);
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const seconds = clamped % 60;

    if (hours > 0) {
      return `${hours} hr ${minutes} min ${seconds} sec`;
    }

    return `${minutes} min ${seconds} sec`;
  }

  private getResultStorageKey(examId: string): string {
    return `freelancy.exam-result.${examId}`;
  }

  private getSessionStorageKey(examId: number | string): string {
    return `freelancy.exam-session.${examId}`;
  }

  toggleApiDebugPanel(): void {
    this.showApiDebugPanel.update((open) => !open);
  }

  private pushApiDebug(entry: Omit<ApiDebugEntry, 'ts'>): void {
    this.apiDebugLogs.update((logs) => [
      {
        ...entry,
        ts: new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      },
      ...logs
    ].slice(0, 15));
  }

  private getErrorStatus(error: unknown): number | 'network' | 'unknown' {
    const status = (error as { status?: number })?.status;
    if (typeof status === 'number') {
      return status;
    }
    return status === 0 ? 'network' : 'unknown';
  }

  private getErrorResponse(error: unknown): unknown {
    return (error as { error?: unknown; message?: string })?.error ?? (error as { message?: string })?.message;
  }

  difficultyClass(diff: string): string {
    return diff.toLowerCase();
  }

  questionStatus(q: SessionQuestion): 'current' | 'answered' | 'skipped' {
    if (q.number - 1 === this.currentIndex()) return 'current';
    if (this.isAnswered(q.id)) return 'answered';
    return 'skipped';
  }
}
