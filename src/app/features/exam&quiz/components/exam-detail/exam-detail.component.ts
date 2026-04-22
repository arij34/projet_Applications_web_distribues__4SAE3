import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { ApiExam, ApiExamSetting, ApiQuestion } from '../../models/api.models';
import { ExamService } from '../../services/exam.service';
import { QuestionService } from '../../services/question.service';
import { ExamInfoCardComponent } from '../exam-info-card/exam-info-card.component';
import { ExamStatsSidebarComponent } from '../exam-stats-sidebar/exam-stats-sidebar.component';
import { QuestionListComponent } from '../question-list/question-list.component';
import { AntiCheatSettingsComponent } from '../anti-cheat-settings/anti-cheat-settings.component';
import { Exam, Question, AntiCheatConfig } from '../exam.model';
import { Exam as ApiMappedExam } from '../../models/exam.model';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExamInfoCardComponent,
    ExamStatsSidebarComponent,
    QuestionListComponent,
    AntiCheatSettingsComponent,
  ],
  templateUrl: './exam-detail.component.html',
  styleUrls: ['./exam-detail.component.scss'],
})
export class ExamDetailComponent implements OnInit, OnDestroy {
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly examService: ExamService,
    private readonly questionService: QuestionService
  ) {}

  isLoading = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  showDeleteConfirm = signal<boolean>(false);
  showDeleteBlockedNotice = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  private successMessageTimer: ReturnType<typeof setTimeout> | null = null;

  exam = signal<Exam>({
    id: '',
    title: '',
    description: '',
    duration: 0,
    passingScore: 60,
    maxAttempts: 1,
    createdBy: 'System',
    createdAt: new Date(),
    status: 'draft',
    type: 'quiz',
    showResult: false,
  });

  questions = signal<Question[]>([]);

  antiCheat = signal<AntiCheatConfig>({
    requireFullscreen: true,
    preventCopyPaste: true,
    preventTabSwitch: true,
    requireWebcam: false,
    ipRestriction: false,
    oneAttemptPerUser: false,
    autoSubmitOnTabSwitch: true,
    deviceFingerprintRequired: false,
    enableSecureSessionToken: true,
    enableDeviceFingerprinting: true,
    suspiciousScoreThreshold: 12,
    autoSubmitOnHighScore: true,
    strictnessLevel: 'MEDIUM',
    detectScreenRecording: false,
    detectVpnProxy: false,
    minutesBetweenAttempts: 0,
  });

  totalPoints = computed(() => this.questions().reduce((sum, q) => sum + q.points, 0));

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const examId = params.get('id');
      if (!examId) {
        this.errorMessage.set('Missing exam id in route.');
        return;
      }
      this.loadExamDetail(examId);
    });
  }

  ngOnDestroy(): void {
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
      this.successMessageTimer = null;
    }
  }

  private loadExamDetail(examId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      exam: this.examService.getExamById(examId),
      questions: this.questionService.getQuestionsByExamId(examId).pipe(
        catchError((err: Error) => {
          this.errorMessage.set(err.message || 'Questions are temporarily unavailable for this exam.');
          return of([] as ApiQuestion[]);
        })
      ),
      settings: this.examService.getExamSettingByExamId(examId).pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ exam, questions, settings }) => {
        this.exam.set(this.mapServiceExamToDetailExam(exam));
        this.questions.set(this.mapApiQuestionsToDetailQuestions(questions));
        this.antiCheat.set(this.mapSettingsToAntiCheat(settings));
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message || 'Failed to load exam details.');
        this.isLoading.set(false);
      }
    });
  }

  private mapServiceExamToDetailExam(exam: ApiMappedExam): Exam {
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description ?? '',
      duration: Number(exam.duration ?? 0),
      passingScore: Number(exam.passingScore ?? 60),
      maxAttempts: Number(exam.maxAttempts ?? 1),
      createdBy: exam.createdBy ?? 'System',
      createdAt: exam.createdAt ? new Date(exam.createdAt) : new Date(),
      status: this.mapStatus(exam.status),
      type: this.mapType(exam.type),
      showResult: Boolean(exam.showResult)
    };
  }

  private mapApiQuestionsToDetailQuestions(questions: ApiQuestion[]): Question[] {
    return questions.map((question, index) => ({
      id: String(question.id ?? `${index + 1}`),
      number: index + 1,
      text: question.questionText ?? '',
      type: this.mapQuestionType(question.questionType ?? question.type),
      difficulty: this.mapDifficulty(question.difficultyLevel),
      points: Number(question.points ?? 0)
    }));
  }

  private mapSettingsToAntiCheat(settings: ApiExamSetting | null): AntiCheatConfig {
    if (!settings) {
      return {
        requireFullscreen: false,
        preventCopyPaste: false,
        preventTabSwitch: false,
        autoSubmitOnTabSwitch: false,
        requireWebcam: false,
        ipRestriction: false,
        oneAttemptPerUser: false,
        deviceFingerprintRequired: false,
        enableSecureSessionToken: true,
        enableDeviceFingerprinting: true,
        suspiciousScoreThreshold: 12,
        autoSubmitOnHighScore: true,
        strictnessLevel: 'MEDIUM',
        detectScreenRecording: false,
        detectVpnProxy: false,
        minutesBetweenAttempts: 0,
      };
    }

    return {
      requireFullscreen: Boolean(settings.requireFullscreen),
      preventCopyPaste: Boolean(settings.preventCopyPaste),
      preventTabSwitch: Boolean(settings.preventTabSwitch),
      autoSubmitOnTabSwitch: Boolean(settings.autoSubmitOnTabSwitch ?? settings.autoSubmitOnTabSwitchLimit),
      requireWebcam: Boolean(settings.webcamRequired),
      ipRestriction: Boolean(settings.ipRestriction),
      oneAttemptPerUser: Boolean(settings.oneAttemptPerUser),
      deviceFingerprintRequired: Boolean(settings.deviceFingerprintRequired),
      enableSecureSessionToken: Boolean(settings.enableSecureSessionToken),
      enableDeviceFingerprinting: Boolean(settings.enableDeviceFingerprinting),
      suspiciousScoreThreshold: Number(settings.suspiciousScoreThreshold ?? 12),
      autoSubmitOnHighScore: Boolean(settings.autoSubmitOnHighScore),
      strictnessLevel: settings.strictnessLevel === 'LOW' || settings.strictnessLevel === 'HIGH' ? settings.strictnessLevel : 'MEDIUM',
      detectScreenRecording: Boolean(settings.detectScreenRecording),
      detectVpnProxy: Boolean(settings.detectVpnProxy),
      minutesBetweenAttempts: Number(settings.minutesBetweenAttempts ?? 0),
    };
  }

  private mapStatus(status: ApiMappedExam['status']): Exam['status'] {
    const key = (status ?? '').toLowerCase();
    if (key === 'active') return 'published';
    if (key === 'archived') return 'archived';
    return 'draft';
  }

  private mapType(type: ApiMappedExam['type']): Exam['type'] {
    const key = (type ?? '').toLowerCase();
    if (key === 'exam') return 'final';
    if (key === 'practice') return 'practice';
    if (key === 'quiz') return 'quiz';
    return 'midterm';
  }

  private mapQuestionType(type: string | undefined): Question['type'] {
    const key = String(type ?? '').toUpperCase();
    if (key === 'TRUE_FALSE' || key === 'TRUE/FALSE') return 'true_false';
    if (key === 'SHORT') return 'short_answer';
    return 'single_choice';
  }

  private mapDifficulty(level: string | undefined): Question['difficulty'] {
    const key = String(level ?? '').toUpperCase();
    if (key === 'EASY') return 'easy';
    if (key === 'HARD') return 'hard';
    return 'medium';
  }

  private mapDetailExamToApi(exam: Exam): Partial<ApiExam> {
    const typeMap: Record<Exam['type'], 'EXAM' | 'QUIZ' | 'PRACTICE'> = {
      final: 'EXAM',
      midterm: 'EXAM',
      quiz: 'QUIZ',
      practice: 'PRACTICE',
    };
    const statusMap: Record<Exam['status'], 'DRAFT' | 'PUBLISHED' | 'CLOSED'> = {
      draft: 'DRAFT',
      published: 'PUBLISHED',
      archived: 'CLOSED',
    };

    return {
      title: exam.title,
      description: exam.description,
      duration: Number(exam.duration),
      passingScore: Number(exam.passingScore),
      maxAttempts: Number(exam.maxAttempts),
      showResult: Boolean(exam.showResult),
      examType: typeMap[exam.type],
      status: statusMap[exam.status],
    };
  }

  private mapAntiCheatToApiSettings(config: AntiCheatConfig, examId: string): ApiExamSetting {
    return {
      exam: { id: examId },
      oneQuestionPerPage: false,
      requireFullscreen: config.requireFullscreen,
      preventTabSwitch: config.preventTabSwitch,
      preventCopyPaste: config.preventCopyPaste,
      webcamRequired: config.requireWebcam,
      autoSubmitOnTabSwitch: config.autoSubmitOnTabSwitch,
      autoSubmitOnTabSwitchLimit: config.autoSubmitOnTabSwitch,
      tabSwitchLimit: 2,
      ipRestriction: config.ipRestriction,
      oneAttemptPerUser: config.oneAttemptPerUser,
      deviceFingerprintRequired: config.deviceFingerprintRequired,
      enableSecureSessionToken: config.enableSecureSessionToken,
      enableDeviceFingerprinting: config.enableDeviceFingerprinting,
      suspiciousScoreThreshold: Number(config.suspiciousScoreThreshold),
      autoSubmitOnHighScore: config.autoSubmitOnHighScore,
      strictnessLevel: config.strictnessLevel,
      detectScreenRecording: config.detectScreenRecording,
      detectVpnProxy: config.detectVpnProxy,
      minutesBetweenAttempts: Number(config.minutesBetweenAttempts),
      randomizeQuestions: false,
      randomizeAnswers: false,
      showTimer: false,
      autoGrade: false,
      instantFeedback: false,
      browserLock: config.requireFullscreen,
      practiceMode: false,
    };
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
    }
    this.successMessageTimer = setTimeout(() => {
      this.successMessage.set('');
      this.successMessageTimer = null;
    }, 3000);
  }

  goBackToExams(): void { this.router.navigate(['/admin/exam-quiz/exams']); }

  openDeleteConfirm(): void {
    if (!this.exam().id || this.isDeleting()) {
      return;
    }
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showDeleteBlockedNotice.set(false);
    this.showDeleteConfirm.set(true);
  }

  cancelDeleteConfirm(): void {
    if (this.isDeleting()) {
      return;
    }
    this.showDeleteConfirm.set(false);
  }

  closeDeleteBlockedNotice(): void {
    this.showDeleteBlockedNotice.set(false);
  }

  confirmDeleteExam(): void {
    const examId = this.exam().id;
    if (!examId || this.isDeleting()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isDeleting.set(true);

    this.examService.deleteExam(examId).pipe(
      finalize(() => this.isDeleting.set(false))
    ).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.router.navigate(['/admin/exam-quiz/exams']);
      },
      error: (err: Error) => {
        this.showDeleteConfirm.set(false);
        if (this.isParticipationDeleteConstraint(err)) {
          this.errorMessage.set('');
          this.showDeleteBlockedNotice.set(true);
          return;
        }
        this.errorMessage.set(err.message || 'Failed to delete this exam.');
      }
    });
  }

  private isParticipationDeleteConstraint(err: Error): boolean {
    const message = (err.message || '').toLowerCase();
    return message.includes('exam_participations')
      || message.includes('participation')
      || message.includes('foreign key constraint');
  }

  onExamUpdated(updated: Exam): void {
    if (!updated.id) {
      this.errorMessage.set('Cannot save exam information: missing exam id.');
      this.successMessage.set('');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.examService.updateExam(updated.id, this.mapDetailExamToApi(updated)).subscribe({
      next: (savedExam) => {
        this.exam.set(this.mapServiceExamToDetailExam(savedExam));
        this.showSuccessMessage('Exam information updated successfully.');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message || 'Failed to update exam information.');
      }
    });
  }
  onQuestionDeleted(id: string): void { this.questions.update(qs => qs.filter(q => q.id !== id)); }
  onQuestionAdded(q: Question): void { this.questions.update(qs => [...qs, q]); }
  onQuestionUpdated(updated: Question): void {
    this.questions.update((questions) =>
      questions.map((question) => (question.id === updated.id ? updated : question))
    );
  }

  onAntiCheatSaved(config: AntiCheatConfig): void {
    const examId = this.exam().id;
    if (!examId) {
      this.errorMessage.set('Cannot save anti-cheating settings: missing exam id.');
      this.successMessage.set('');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    const payload = this.mapAntiCheatToApiSettings(config, examId);

    this.examService.getExamSettingByExamId(examId).pipe(
      switchMap((existing) => {
        if (existing?.id != null) {
          const mergedPayload: ApiExamSetting = {
            ...existing,
            ...payload,
            exam: existing.exam ?? payload.exam,
          };
          return this.examService.updateExamSetting(String(existing.id), mergedPayload);
        }
        return this.examService.createExamSetting(payload);
      })
    ).subscribe({
      next: (savedSettings) => {
        this.antiCheat.set(this.mapSettingsToAntiCheat(savedSettings));
        this.showSuccessMessage('Anti-cheating settings saved successfully.');
      },
      error: (err: Error) => {
        this.successMessage.set('');
        this.errorMessage.set(err.message || 'Failed to save anti-cheating settings.');
      }
    });
  }
}
