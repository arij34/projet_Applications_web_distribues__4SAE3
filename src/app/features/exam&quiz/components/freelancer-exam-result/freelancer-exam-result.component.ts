import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { catchError, from, of, switchMap } from 'rxjs';
import { ExamService } from '../../services/exam.service';
import { ResultDto, ResultService } from '../../services/result.service';
import { MeService } from '../../../../core/services/me.service';

interface QuestionResult {
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
  results: QuestionResult[];
}

@Component({
  selector: 'app-freelancer-exam-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './freelancer-exam-result.component.html',
  styleUrls: ['./freelancer-exam-result.component.scss'],
})
export class FreelancerExamResultComponent implements OnInit {
  results = signal<QuestionResult[]>([]);
  expandedReview = signal(false);
  expandedQuestion = signal<string | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  examTitle = 'Exam Result';
  passingScore = 70;
  timeTaken = '0 min 0 sec';
  examId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly examService: ExamService,
    private readonly resultService: ResultService,
    private readonly meService: MeService,
  ) {}

  earnedTotal = computed(() => this.results().reduce((s, q) => s + q.earnedPoints, 0));
  maxTotal = computed(() => this.results().reduce((s, q) => s + q.points, 0));
  percentScore = computed(() => {
    const maxTotal = this.maxTotal();
    if (maxTotal <= 0) return 0;
    return Math.round((this.earnedTotal() / maxTotal) * 100);
  });
  passed = computed(() => this.percentScore() >= this.passingScore);

  correctCount = computed(() => this.results().filter(q => q.status === 'correct').length);
  wrongCount = computed(() => this.results().filter(q => q.status === 'wrong').length);
  partialCount = computed(() => this.results().filter(q => q.status === 'partial').length);
  skippedCount = computed(() => this.results().filter(q => q.status === 'skipped').length);

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id') ?? '';

    from(this.meService.me()).pipe(
      catchError(() => of({ id: 0 })),
      switchMap((meDto) => {
        const userId = Number(meDto.id ?? 0);
        if (!userId || !this.examId) {
          return of(null);
        }

        return this.resultService.getMyResult(userId, Number(this.examId)).pipe(
          catchError(() => of(null))
        );
      }),
      switchMap((result) => {
        if (result) {
          this.applyBackendResult(result);
          this.isLoading.set(false);
          return of(null);
        }

        return this.examService.getExamById(this.examId).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe((exam) => {
      if (exam) {
        this.examTitle = exam.title || 'Exam Result';
        this.passingScore = Number(exam.passingScore ?? 70);
      }

      if (this.results().length === 0) {
        const localSnapshot = this.readLocalSnapshot(this.examId);
        if (localSnapshot) {
          this.applyLocalSnapshot(localSnapshot);
          this.loadError.set('Backend result is not available yet. Showing local fallback result.');
        } else {
          this.loadError.set('No recorded result was found in backend for this user and exam yet.');
        }
      }
      this.isLoading.set(false);
    });
  }

  toggleReview(): void { this.expandedReview.update(v => !v); }
  toggleQuestion(id: string): void {
    this.expandedQuestion.update(curr => curr === id ? null : id);
  }

  statusLabel(status: QuestionResult['status']): string {
    if (status === 'correct') return 'Correct';
    if (status === 'wrong') return 'Wrong';
    if (status === 'partial') return 'Partial';
    return 'Skipped';
  }

  difficultyClass(d: string): string { return d.toLowerCase(); }

  private applyBackendResult(result: ResultDto): void {
    this.passingScore = Number(this.passingScore || 70);

    const scorePercent = Number(
      result.scorePercent ??
      (Number(result.totalPoints || 0) > 0
        ? Math.round((Number(result.earnedPoints || 0) / Number(result.totalPoints || 1)) * 100)
        : 0)
    );

    const questionResults = Array.isArray(result.questionResults)
      ? result.questionResults
      : Array.isArray(result.answers)
        ? result.answers
        : [];

    if (questionResults.length > 0) {
      this.results.set(questionResults.map((item, idx) => ({
        id: String(item.questionId ?? idx + 1),
        number: idx + 1,
        text: item.questionText ?? `Question ${idx + 1}`,
        points: Number(item.totalPoints ?? 0),
        earnedPoints: Number(item.earnedPoints ?? 0),
        status: this.normalizeStatus(item.status),
        difficulty: this.normalizeDifficulty(item.difficulty),
        yourAnswer: item.yourAnswer,
        correctAnswer: item.correctAnswer,
      })));
    } else {
      this.results.set([{
        id: 'summary',
        number: 1,
        text: 'Exam Summary',
        points: Number(result.totalPoints ?? 0),
        earnedPoints: Number(result.earnedPoints ?? 0),
        status: scorePercent >= this.passingScore ? 'correct' : 'wrong',
        difficulty: 'MEDIUM',
        yourAnswer: 'N/A',
        correctAnswer: undefined,
      }]);
    }

    const seconds = Number(result.timeTakenSeconds ?? 0);
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    this.timeTaken = `${mins} min ${rem} sec`;
  }

  private normalizeStatus(status: string | undefined): QuestionResult['status'] {
    const upper = String(status ?? '').toUpperCase();
    if (upper === 'CORRECT') return 'correct';
    if (upper === 'WRONG' || upper === 'FAILED') return 'wrong';
    if (upper === 'PARTIAL') return 'partial';
    if (upper === 'SKIPPED') return 'skipped';
    return 'wrong';
  }

  private normalizeDifficulty(value: string | undefined): QuestionResult['difficulty'] {
    const upper = String(value ?? '').toUpperCase();
    if (upper === 'EASY' || upper === 'HARD') return upper;
    return 'MEDIUM';
  }

  private applyLocalSnapshot(snapshot: StoredExamResultSnapshot): void {
    this.examTitle = snapshot.examTitle || this.examTitle;
    this.passingScore = Number(snapshot.passingScore ?? this.passingScore);
    this.timeTaken = snapshot.timeTaken || this.timeTaken;
    this.results.set(Array.isArray(snapshot.results) ? snapshot.results : []);
  }

  private readLocalSnapshot(examId: string): StoredExamResultSnapshot | null {
    if (!examId) {
      return null;
    }

    const raw = window.localStorage.getItem(this.getResultStorageKey(examId));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredExamResultSnapshot;
      if (!Array.isArray(parsed.results)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private getResultStorageKey(examId: string): string {
    return `freelancy.exam-result.${examId}`;
  }
}
