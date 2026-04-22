import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface QuickAction {
  title: string;
  description: string;
  route: string;
  cta: string;
}

interface DashboardOperationalMetrics {
  totalParticipations: number;
  totalResults: number;
  activeAttempts: number;
  completedAttempts: number;
  completionRate: number;
  successRate: number;
  failureRate: number;
  cheatingRate: number;
  averageSuspiciousEvents: number;
  suspiciousEventsTotal: number;
  passedCount: number;
  failedCount: number;
  autoSubmittedCount: number;
  otherResultCount: number;
}

interface DashboardRateGraphItem {
  label: string;
  value: number;
  color: string;
}

interface ApiParticipation {
  id?: number;
  userId?: number;
  status?: string;
  completedAt?: string | null;
  exam?: {
    id?: number;
    passingScore?: number;
  } | null;
}

interface ApiResult {
  id?: number;
  examId?: number;
  userId?: number;
  scorePercent?: number;
  status?: string;
}

interface ApiCheatingLog {
  id?: number;
  eventType?: string;
  eventTime?: string;
  details?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  quickActions: QuickAction[] = [
    {
      title: 'Exams Management',
      description: 'Create, edit, archive, and organize all exams in one place.',
      route: '/admin/exam-quiz/exams',
      cta: 'Open Exams'
    },
    {
      title: 'Question Bank',
      description: 'Maintain reusable questions and map them to exam templates.',
      route: '/admin/exam-quiz/questions',
      cta: 'Open Questions'
    },
    {
      title: 'Cheating Logs',
      description: 'Review suspicious activities and enforce assessment integrity.',
      route: '/admin/exam-quiz/cheating-logs',
      cta: 'Review Logs'
    }
  ];

  metricsLoading = false;
  metricsError = '';
  metricsGeneratedAt = '';

  metrics: DashboardOperationalMetrics = {
    totalParticipations: 0,
    totalResults: 0,
    activeAttempts: 0,
    completedAttempts: 0,
    completionRate: 0,
    successRate: 0,
    failureRate: 0,
    cheatingRate: 0,
    averageSuspiciousEvents: 0,
    suspiciousEventsTotal: 0,
    passedCount: 0,
    failedCount: 0,
    autoSubmittedCount: 0,
    otherResultCount: 0
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadOperationalMetrics();
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  get rateGraphItems(): DashboardRateGraphItem[] {
    return [
      { label: 'Success Rate', value: this.metrics.successRate, color: '#1d4ed8' },
      { label: 'Failure Rate', value: this.metrics.failureRate, color: '#b91c1c' },
      { label: 'Cheating Rate', value: this.metrics.cheatingRate, color: '#d97706' },
      { label: 'Completion Rate', value: this.metrics.completionRate, color: '#0f766e' }
    ];
  }

  get hasResultDistribution(): boolean {
    return this.metrics.totalResults > 0;
  }

  get resultDistributionStyle(): Record<string, string> {
    const total = Math.max(this.metrics.totalResults, 1);
    const passedPct = (this.metrics.passedCount / total) * 100;
    const failedPct = (this.metrics.failedCount / total) * 100;
    const autoSubmittedPct = (this.metrics.autoSubmittedCount / total) * 100;
    const otherPct = Math.max(100 - passedPct - failedPct - autoSubmittedPct, 0);

    const c1 = passedPct;
    const c2 = c1 + failedPct;
    const c3 = c2 + autoSubmittedPct;
    const c4 = c3 + otherPct;

    return {
      background: `conic-gradient(#1d4ed8 0 ${c1.toFixed(2)}%, #b91c1c ${c1.toFixed(2)}% ${c2.toFixed(2)}%, #d97706 ${c2.toFixed(2)}% ${c3.toFixed(2)}%, #64748b ${c3.toFixed(2)}% ${c4.toFixed(2)}%)`
    };
  }

  get resultDistributionLegend(): Array<{ label: string; count: number; color: string }> {
    return [
      { label: 'Passed', count: this.metrics.passedCount, color: '#1d4ed8' },
      { label: 'Failed', count: this.metrics.failedCount, color: '#b91c1c' },
      { label: 'Auto-submitted', count: this.metrics.autoSubmittedCount, color: '#d97706' },
      { label: 'Other', count: this.metrics.otherResultCount, color: '#64748b' }
    ];
  }

  rateBarStyle(value: number, color: string): Record<string, string> {
    const width = Math.max(2, Math.min(100, Number(value || 0)));
    return {
      width: `${width}%`,
      background: color
    };
  }

  private loadOperationalMetrics(): void {
    this.metricsLoading = true;
    this.metricsError = '';

    const participations$ = this.http.get<ApiParticipation[]>(`${environment.apiBaseUrl}/api/exam-participations`).pipe(
      catchError(() => of([] as ApiParticipation[]))
    );

    // Using userId=1 because backend exposes history per authenticated/admin-visible user path.
    const resultParams = new HttpParams().set('userId', '1');
    const results$ = this.http.get<ApiResult[]>(`${environment.apiBaseUrl}/api/results/history/me`, { params: resultParams }).pipe(
      catchError(() => of([] as ApiResult[]))
    );

    const cheatingLogs$ = this.http.get<ApiCheatingLog[]>(`${environment.apiBaseUrl}/api/cheating-logs`).pipe(
      catchError(() => of([] as ApiCheatingLog[]))
    );

    forkJoin({ participations: participations$, results: results$, cheatingLogs: cheatingLogs$ })
      .pipe(
        map(({ participations, results, cheatingLogs }) => this.computeMetrics(participations, results, cheatingLogs))
      )
      .subscribe({
        next: (computed) => {
          this.metrics = computed;
          this.metricsGeneratedAt = new Date().toLocaleString();
          this.metricsLoading = false;
        },
        error: () => {
          this.metricsError = 'Failed to load dashboard metrics.';
          this.metricsLoading = false;
        }
      });
  }

  private computeMetrics(
    participations: ApiParticipation[],
    results: ApiResult[],
    cheatingLogs: ApiCheatingLog[]
  ): DashboardOperationalMetrics {
    const totalParticipations = participations.length;
    const totalResults = results.length;

    const activeAttempts = participations.filter((p) => {
      const status = String(p.status ?? '').toUpperCase();
      return status === 'REGISTERED' || status === 'IN_PROGRESS' || status === 'STARTED';
    }).length;

    const completedAttempts = participations.filter((p) => {
      const status = String(p.status ?? '').toUpperCase();
      return !!p.completedAt || status === 'COMPLETED' || status === 'SUBMITTED' || status === 'FINISHED';
    }).length;

    const passingScoreByExam = new Map<number, number>();
    for (const p of participations) {
      const examId = Number(p.exam?.id ?? 0);
      const passing = Number(p.exam?.passingScore ?? 0);
      if (examId > 0 && Number.isFinite(passing) && passing > 0) {
        passingScoreByExam.set(examId, passing);
      }
    }

    const scoredResults = results.filter((r) => Number.isFinite(Number(r.scorePercent ?? NaN)));

    const passedCount = scoredResults.filter((r) => {
      const scorePercent = Number(r.scorePercent ?? 0);
      const examId = Number(r.examId ?? 0);
      const threshold = passingScoreByExam.get(examId) ?? 70;
      return scorePercent >= threshold;
    }).length;

    const failedCount = Math.max(scoredResults.length - passedCount, 0);

    const autoSubmittedCount = results.filter((r) => String(r.status ?? '').toUpperCase() === 'AUTO_SUBMITTED').length;
    const statusPassedCount = results.filter((r) => String(r.status ?? '').toUpperCase() === 'PASSED').length;
    const statusFailedCount = results.filter((r) => String(r.status ?? '').toUpperCase() === 'FAILED').length;
    const otherResultCount = Math.max(totalResults - statusPassedCount - statusFailedCount - autoSubmittedCount, 0);
    const suspiciousEventsTotal = cheatingLogs.length;

    return {
      totalParticipations,
      totalResults,
      activeAttempts,
      completedAttempts,
      completionRate: this.rate(completedAttempts, totalParticipations),
      successRate: this.rate(passedCount, scoredResults.length),
      failureRate: this.rate(failedCount, scoredResults.length),
      cheatingRate: this.rate(autoSubmittedCount, totalResults || totalParticipations),
      averageSuspiciousEvents: totalParticipations > 0 ? suspiciousEventsTotal / totalParticipations : 0,
      suspiciousEventsTotal,
      passedCount: statusPassedCount,
      failedCount: statusFailedCount,
      autoSubmittedCount,
      otherResultCount
    };
  }

  private rate(value: number, total: number): number {
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }
    return (Math.max(0, value) / total) * 100;
  }
}
