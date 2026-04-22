import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { catchError, forkJoin, from, map, of, switchMap } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { ApiExam } from '../../models/api.models';
import { ResultDto, ResultService } from '../../services/result.service';
import { MeService } from '../../../../core/services/me.service';

export type FreelancerExamType = 'EXAM' | 'QUIZ' | 'PRACTICE';
export type FreelancerExamStatus = 'PUBLISHED' | 'CLOSED';
export type MyAttemptStatus = 'not_started' | 'in_progress' | 'passed' | 'failed';

export interface FreelancerExamCard {
  id: string;
  title: string;
  description: string;
  type: FreelancerExamType;
  duration: number;
  totalMarks: number;
  passingScore: number;
  questionCount: number;
  endDate: string;
  status: FreelancerExamStatus;
  myStatus: MyAttemptStatus;
  myScore?: number;
}

type FilterTab = 'ALL' | FreelancerExamType | 'COMPLETED';

interface ApiQuestionRef {
  id?: string | number;
  examId?: string | number;
  exam?: { id?: string | number };
  points?: number;
}

@Component({
  selector: 'app-freelancer-exam-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SharedModule],
  templateUrl: './freelancer-exam-catalog.component.html',
  styleUrls: ['./freelancer-exam-catalog.component.scss'],
})
export class FreelancerExamCatalogComponent implements OnInit {
  searchTerm = signal('');
  activeFilter = signal<FilterTab>('ALL');
  sortBy = signal<'newest' | 'oldest' | 'duration_asc' | 'duration_desc' | 'points_asc' | 'points_desc' | 'reqScore_asc' | 'reqScore_desc'>('newest');
  userExperiencePoints = signal<number>(0);

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All Assessments' },
    { key: 'PRACTICE', label: 'Practice' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  readonly exams = signal<FreelancerExamCard[]>([]);

  constructor(
    private readonly http: HttpClient,
    private readonly resultService: ResultService,
    private readonly meService: MeService,
  ) {}

  ngOnInit(): void {
    this.loadExams();
  }

  filteredExams = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filter = this.activeFilter();
    const sort = this.sortBy();

    let list = this.exams().filter(e => {
      const matchSearch = !term || e.title.toLowerCase().includes(term) || e.description.toLowerCase().includes(term);
      const matchFilter =
        filter === 'ALL' ? (e.status === 'PUBLISHED' && e.myStatus !== 'passed' && e.myStatus !== 'failed') :
        filter === 'COMPLETED' ? (e.myStatus === 'passed' || e.myStatus === 'failed' || e.status === 'CLOSED') :
        e.type === filter;
      return matchSearch && matchFilter;
    });

    if (sort === 'oldest')       list = [...list].sort((a, b) => Number(a.id) - Number(b.id));
    if (sort === 'duration_asc')  list = [...list].sort((a, b) => a.duration - b.duration);
    if (sort === 'duration_desc') list = [...list].sort((a, b) => b.duration - a.duration);
    if (sort === 'points_asc')    list = [...list].sort((a, b) => a.totalMarks - b.totalMarks);
    if (sort === 'points_desc')   list = [...list].sort((a, b) => b.totalMarks - a.totalMarks);
    if (sort === 'reqScore_asc')  list = [...list].sort((a, b) => a.passingScore - b.passingScore);
    if (sort === 'reqScore_desc') list = [...list].sort((a, b) => b.passingScore - a.passingScore);
    return list;
  });

  get stats() {
    const all = this.exams();
    return {
      available: all.filter(e => e.status === 'PUBLISHED' && e.myStatus === 'not_started').length,
      inProgress: all.filter(e => e.myStatus === 'in_progress').length,
      passed: all.filter(e => e.myStatus === 'passed').length,
      total: all.length,
    };
  }

  statusMeta(e: FreelancerExamCard): { label: string; cls: string } {
    if (e.myStatus === 'passed') return { label: 'Passed', cls: 'tag-passed' };
    if (e.myStatus === 'failed') return { label: 'Failed', cls: 'tag-failed' };
    if (e.myStatus === 'in_progress') return { label: 'In Progress', cls: 'tag-progress' };
    if (e.status === 'CLOSED') return { label: 'Completed', cls: 'tag-closed' };
    return { label: 'Available', cls: 'tag-available' };
  }

  typeIcon(type: FreelancerExamType): string {
    if (type === 'QUIZ') return '⚡';
    if (type === 'PRACTICE') return '🎯';
    return '📋';
  }

  ctaLabel(e: FreelancerExamCard): string {
    if (e.myStatus === 'in_progress') return 'Continue';
    if (e.myStatus === 'passed' || e.myStatus === 'failed') return 'See Results';
    if (e.status === 'CLOSED') return 'View Details';
    return 'Start Exam';
  }

  ctaRoute(e: FreelancerExamCard): string[] {
    if (e.myStatus === 'passed' || e.myStatus === 'failed') return ['/exams', e.id, 'result'];
    return ['/exams', e.id];
  }

  descriptionPreview(text: string): string {
    const normalized = (text ?? '').replace(/\r\n/g, '\n');
    const firstNonEmptyLine = normalized.split('\n').map((line) => line.trim()).find((line) => line.length > 0);
    return firstNonEmptyLine ?? '';
  }

  daysLeft(endDate: string): number {
    return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
  }

  trackById(_: number, e: FreelancerExamCard): string { return e.id; }

  private loadExams(): void {
    from(this.meService.me()).pipe(
      catchError(() => of({ id: 0, experiencePoints: 0 })),
      switchMap((meDto) => {
        this.userExperiencePoints.set(Number(meDto.experiencePoints ?? 0));
        const userId = Number(meDto.id ?? 0);
        const resultHistory$ = userId
          ? this.resultService.getMyHistory(userId).pipe(catchError(() => of([] as ResultDto[])))
          : of([] as ResultDto[]);

        return forkJoin({
          exams: this.http.get<ApiExam[]>(`${environment.apiBaseUrl}/api/exams`),
          resultHistory: resultHistory$
        });
      }),
      switchMap(({ exams, resultHistory }) => {
        if (exams.length === 0) {
          return of([] as FreelancerExamCard[]);
        }

        const resultsByExam = new Map<number, ResultDto>();
        resultHistory.forEach((item) => {
          resultsByExam.set(Number(item.examId), item);
        });

        const questionStatsRequests = exams
          .filter((exam) => exam.id != null)
          .map((exam) =>
            this.http.get<ApiQuestionRef[]>(`${environment.apiBaseUrl}/api/questions/by-exam/${exam.id}`).pipe(
              map((questions) => ({
                examId: String(exam.id),
                questionCount: questions.length,
                pointsFromQuestions: questions.reduce((sum, q) => sum + Number(q.points ?? 0), 0),
              })),
              catchError(() =>
                of({
                  examId: String(exam.id),
                  questionCount: 0,
                  pointsFromQuestions: 0,
                })
              )
            )
          );

        return forkJoin(questionStatsRequests).pipe(
          map((questionStats) => {
            const statsByExamId = new Map<string, { questionCount: number; pointsFromQuestions: number }>();
            for (const stat of questionStats) {
              statsByExamId.set(stat.examId, {
                questionCount: stat.questionCount,
                pointsFromQuestions: stat.pointsFromQuestions,
              });
            }

            return exams
              .map((exam) => {
                const stat = statsByExamId.get(String(exam.id ?? ''));
                return this.mapApiExamToCard(
                  exam,
                  stat?.questionCount ?? 0,
                  stat?.pointsFromQuestions ?? 0,
                  resultsByExam.get(Number(exam.id))
                );
              })
              .filter((item): item is FreelancerExamCard => item !== null);
          })
        );
      }),
      catchError((error) => {
        console.error('Failed to load exams catalog from backend', error);
        return of([] as FreelancerExamCard[]);
      })
    ).subscribe((items) => this.exams.set(items));
  }

  private mapApiExamToCard(
    api: ApiExam,
    questionCount: number,
    pointsFromQuestions: number,
    result?: ResultDto
  ): FreelancerExamCard | null {
    if (api.id == null || !api.title) return null;

    const rawType = String(api.examType ?? api.type ?? 'EXAM').toUpperCase();
    const type: FreelancerExamType =
      rawType === 'QUIZ' ? 'QUIZ' :
      rawType === 'PRACTICE' ? 'PRACTICE' :
      'EXAM';

    const rawStatus = String(api.status ?? 'DRAFT').toUpperCase();
    const status: FreelancerExamStatus = rawStatus === 'CLOSED' || rawStatus === 'ARCHIVED' ? 'CLOSED' : 'PUBLISHED';

    const totalMarks = Number(api.points ?? api.totalMarks ?? 0) || pointsFromQuestions;

    const mappedCard: FreelancerExamCard = {
      id: String(api.id),
      title: api.title,
      description: api.description ?? 'No description provided yet.',
      type,
      duration: Number(api.duration ?? 0),
      totalMarks,
      passingScore: Number(api.passingScore ?? 0),
      questionCount,
      endDate: api.endDate ?? api.startDate ?? new Date().toISOString(),
      status,
      myStatus: 'not_started'
    };

    if (result) {
      const percent = Number(
        result.scorePercent ??
        (Number(result.totalPoints ?? 0) > 0
          ? Math.round((Number(result.earnedPoints ?? 0) / Number(result.totalPoints ?? 1)) * 100)
          : 0)
      );
      const effectivePassing = Number(api.passingScore ?? 70);

      mappedCard.myStatus = percent >= effectivePassing ? 'passed' : 'failed';
      mappedCard.myScore = percent;
    }

    return mappedCard;
  }
}
