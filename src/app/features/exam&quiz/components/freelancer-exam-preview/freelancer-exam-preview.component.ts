import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize, forkJoin, from, map, of, switchMap, throwError } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { ApiExam, ApiExamSetting } from '../../models/api.models';
import { ResultDto, ResultService } from '../../services/result.service';
import { MeService } from '../../../../core/services/me.service';

interface ExamRule {
  icon: string;
  title: string;
  description: string;
}

interface ApiQuestionRef {
  id?: string | number;
  examId?: string | number;
  exam?: { id?: string | number };
  points?: number;
}

interface JoinExamParticipationResponse {
  attemptId?: number;
  sessionToken?: string;
  participationId?: number;
  token?: string;
}

interface ExamPreviewData {
  id: string;
  title: string;
  description: string;
  type: 'EXAM' | 'QUIZ' | 'PRACTICE';
  status: 'PUBLISHED' | 'CLOSED';
  duration: number;
  pointsToEarn: number;
  totalMarks: number;
  passingScore: number;
  questionCount: number;
  maxAttempts: number;
  attemptsUsed: number;
  showResult: boolean;
  startDate: string;
  endDate: string;
  myStatus: 'not_started' | 'in_progress' | 'passed' | 'failed';
  myScore?: number;
  antiCheat: {
    requireFullscreen: boolean;
    preventCopyPaste: boolean;
    preventTabSwitch: boolean;
    webcamRequired: boolean;
    randomizeQuestions: boolean;
    randomizeAnswers: boolean;
    oneAttemptPerUser: boolean;
  };
}

const MOCK_PREVIEW: ExamPreviewData = {
  id: '10',
  title: 'Angular Fundamentals',
  description: `This assessment is designed to evaluate your understanding of the Angular framework at a professional level. 
  You will be tested on core Angular concepts including components, directives, services, dependency injection, 
  routing and navigation, reactive forms, RxJS observables, and performance optimization techniques.
  
  Successfully passing this exam demonstrates your readiness to work on Angular-based projects and will 
  be visible to potential clients on your freelancer profile.`,
  type: 'EXAM',
  status: 'PUBLISHED',
  duration: 60,
  pointsToEarn: 100,
  totalMarks: 100,
  passingScore: 70,
  questionCount: 20,
  maxAttempts: 2,
  attemptsUsed: 0,
  showResult: true,
  startDate: '2026-04-01',
  endDate: '2026-05-01',
  myStatus: 'not_started',
  antiCheat: {
    requireFullscreen: true,
    preventCopyPaste: true,
    preventTabSwitch: true,
    webcamRequired: false,
    randomizeQuestions: true,
    randomizeAnswers: true,
    oneAttemptPerUser: false,
  },
};

@Component({
  selector: 'app-freelancer-exam-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './freelancer-exam-preview.component.html',
  styleUrls: ['./freelancer-exam-preview.component.scss'],
})
export class FreelancerExamPreviewComponent implements OnInit {
  exam = signal<ExamPreviewData | null>(null);
  isLoading = signal(true);
  confirmModalOpen = signal(false);
  isStarting = signal(false);
  startError = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly resultService: ResultService,
    private readonly meService: MeService,
  ) {}

  ngOnInit(): void {
    const examId = this.route.snapshot.paramMap.get('id');
    if (!examId) {
      this.exam.set(MOCK_PREVIEW);
      this.isLoading.set(false);
      return;
    }

    this.loadExamFromBackend(examId);
  }

  get activeRules(): ExamRule[] {
    const exam = this.exam();
    if (!exam) return [];
    const rules: ExamRule[] = [];
    if (exam.antiCheat.requireFullscreen)
      rules.push({ icon: '⛶', title: 'Fullscreen Required', description: 'The exam must be taken in fullscreen mode. Exiting will be flagged.' });
    if (exam.antiCheat.preventCopyPaste)
      rules.push({ icon: '⚡', title: 'Copy & Paste Disabled', description: 'Copying or pasting text during the exam is not permitted.' });
    if (exam.antiCheat.preventTabSwitch)
      rules.push({ icon: '🔒', title: 'Tab Switching Monitored', description: 'Switching browser tabs or windows will be detected and recorded.' });
    if (exam.antiCheat.webcamRequired)
      rules.push({ icon: '📷', title: 'Webcam Required', description: 'Your webcam must be active throughout the exam for identity verification.' });
    if (exam.antiCheat.randomizeQuestions)
      rules.push({ icon: '🔀', title: 'Randomized Questions', description: 'Questions will appear in a randomized order unique to your session.' });
    if (exam.antiCheat.randomizeAnswers)
      rules.push({ icon: '🔀', title: 'Randomized Answers', description: 'Answer choices are shuffled for each question.' });
    return rules;
  }

  get canStart(): boolean {
    const exam = this.exam();
    if (!exam) return false;
    return exam.status === 'PUBLISHED' &&
           (exam.myStatus === 'not_started' || exam.myStatus === 'in_progress') &&
           exam.attemptsUsed < exam.maxAttempts;
  }

  get ctaState(): 'start' | 'continue' | 'no_attempts' | 'view_result' | 'closed' {
    const exam = this.exam();
    if (!exam) return 'closed';
    if (exam.myStatus === 'passed' || exam.myStatus === 'failed') return 'view_result';
    if (exam.status === 'CLOSED') return 'closed';
    if (exam.attemptsUsed >= exam.maxAttempts) return 'no_attempts';
    if (exam.myStatus === 'in_progress') return 'continue';
    return 'start';
  }

  startExam(): void {
    this.startError.set(null);
    this.confirmModalOpen.set(true);
  }

  confirmStart(): void {
    const exam = this.exam();
    if (!exam || this.isStarting()) return;

    this.isStarting.set(true);
    this.startError.set(null);

    const participationCheckUrl = `${environment.apiBaseUrl}/api/exam-participations/my/exam/${exam.id}`;
    const participationJoinUrl = `${environment.apiBaseUrl}/api/exam-participations/${exam.id}/join`;

    this.http.get<JoinExamParticipationResponse>(participationCheckUrl).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.post<JoinExamParticipationResponse>(participationJoinUrl, null);
        }

        return throwError(() => error);
      }),
      finalize(() => this.isStarting.set(false))
    ).subscribe({
      next: (response) => {
        const attemptId = Number(response?.attemptId ?? response?.participationId ?? 0);
        const sessionToken = String(response?.sessionToken ?? response?.token ?? '').trim();

        if (attemptId > 0 || sessionToken.length > 0) {
          const sessionContext = {
            attemptId: attemptId > 0 ? attemptId : null,
            sessionToken: sessionToken.length > 0 ? sessionToken : null,
          };
          window.sessionStorage.setItem(this.getSessionStorageKey(exam.id), JSON.stringify(sessionContext));
        }

        this.confirmModalOpen.set(false);
        this.router.navigate(['/exams', exam.id, 'take']);
      },
      error: (error) => {
        console.error('Failed to join exam participation', error);
        this.startError.set('Unable to start exam right now. Please try again.');
      }
    });
  }

  cancelStart(): void {
    this.confirmModalOpen.set(false);
  }

  typeLabel(type: string): string {
    if (type === 'QUIZ') return 'Quiz';
    if (type === 'PRACTICE') return 'Practice';
    return 'Exam';
  }

  private loadExamFromBackend(examId: string): void {
    from(this.meService.me()).pipe(
      catchError(() => of({ id: 0 })),
      switchMap((meDto) => {
        const userId = Number(meDto.id ?? 0);
        const result$ = userId
          ? this.resultService.getMyHistory(userId).pipe(
              map((items) => items.find((item) => Number(item.examId) === Number(examId)) ?? null),
              catchError(() => of(null))
            )
          : of(null);

        return forkJoin({
          exams: this.http.get<ApiExam[]>(`${environment.apiBaseUrl}/api/exams`),
          settings: this.http.get<ApiExamSetting[]>(`${environment.apiBaseUrl}/api/exam-settings`).pipe(
            map((items) => items.find((s) => String(s.examId ?? s.exam?.id ?? '') === examId) ?? null),
            catchError(() => of(null))
          ),
          questions: this.http.get<ApiQuestionRef[]>(`${environment.apiBaseUrl}/api/questions/by-exam/${examId}`).pipe(
            catchError(() => this.http.get<ApiQuestionRef[]>(`${environment.apiBaseUrl}/api/questions`).pipe(
              map((items) => items.filter((q) => String(q.examId ?? q.exam?.id ?? '') === examId)),
              catchError(() => of([]))
            ))
          ),
          result: result$
        });
      }),
      map(({ exams, settings, questions, result }) => {
        const exam = exams.find((item) => String(item.id ?? '') === examId);
        if (!exam) throw new Error(`Exam ${examId} not found`);
        const pointsToEarn = questions.reduce((sum, q) => sum + Number(q.points ?? 0), 0);
        return this.mapApiToPreview(exam, settings, questions.length, pointsToEarn, result ?? undefined);
      }),
      catchError((error) => {
        console.error('Failed to load exam preview from backend', error);
        return of(MOCK_PREVIEW);
      })
    ).subscribe((item) => {
      this.exam.set(item);
      this.isLoading.set(false);
    });
  }

  private mapApiToPreview(
    api: ApiExam,
    settings: ApiExamSetting | null,
    questionCount: number,
    pointsToEarn: number,
    result?: ResultDto
  ): ExamPreviewData {
    const rawType = String(api.examType ?? api.type ?? 'EXAM').toUpperCase();
    const type: ExamPreviewData['type'] =
      rawType === 'QUIZ' ? 'QUIZ' :
      rawType === 'PRACTICE' ? 'PRACTICE' :
      'EXAM';

    const rawStatus = String(api.status ?? 'DRAFT').toUpperCase();
    const status: ExamPreviewData['status'] = rawStatus === 'CLOSED' || rawStatus === 'ARCHIVED' ? 'CLOSED' : 'PUBLISHED';

    const examLevelPoints = Number(api.points ?? api.totalMarks ?? 0);
    const resolvedPointsToEarn = examLevelPoints > 0 ? examLevelPoints : pointsToEarn;

    const preview: ExamPreviewData = {
      id: String(api.id ?? ''),
      title: api.title ?? 'Untitled Assessment',
      description: api.description ?? 'No description provided for this assessment yet.',
      type,
      status,
      duration: Number(api.duration ?? 0),
      pointsToEarn: resolvedPointsToEarn,
      totalMarks: Number(api.totalMarks ?? 0),
      passingScore: Number(api.passingScore ?? 0),
      questionCount,
      maxAttempts: Number(api.maxAttempts ?? 1),
      attemptsUsed: 0,
      showResult: Boolean(api.showResult ?? true),
      startDate: api.startDate ?? new Date().toISOString(),
      endDate: api.endDate ?? api.startDate ?? new Date().toISOString(),
      myStatus: 'not_started',
      antiCheat: {
        requireFullscreen: Boolean(settings?.requireFullscreen ?? true),
        preventCopyPaste: Boolean(settings?.preventCopyPaste ?? true),
        preventTabSwitch: Boolean(settings?.preventTabSwitch ?? true),
        webcamRequired: Boolean(settings?.webcamRequired ?? false),
        randomizeQuestions: Boolean(settings?.randomizeQuestions ?? true),
        randomizeAnswers: Boolean(settings?.randomizeAnswers ?? true),
        oneAttemptPerUser: Boolean(settings?.oneAttemptPerUser ?? false)
      }
    };

    if (result) {
      const percent = Number(
        result.scorePercent ??
        (Number(result.totalPoints ?? 0) > 0
          ? Math.round((Number(result.earnedPoints ?? 0) / Number(result.totalPoints ?? 1)) * 100)
          : 0)
      );
      const effectivePassing = Number(api.passingScore ?? 70);
      preview.myStatus = percent >= effectivePassing ? 'passed' : 'failed';
      preview.myScore = percent;
      preview.attemptsUsed = preview.maxAttempts;
    }

    return preview;
  }

  private getSessionStorageKey(examId: string): string {
    return `freelancy.exam-session.${examId}`;
  }
}
