import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, timer, merge, of, Observable } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { QualityGateStatusComponent } from '../quality-gate-status/quality-gate-status.component';
import { MetricCardComponent } from '../metric-card/metric-card.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { CodeHealthScoreComponent } from '../code-health-score/code-health-score.component';
import { InfoBarComponent } from '../info-bar/info-bar.component';
import { DetailedBreakdownComponent } from '../detailed-breakdown/detailed-breakdown.component';
import { AnalysisData, MetricVariant } from '../../models/analysis.model';
import { ParticipationService, SonarResultResponse } from '../../../../../core/services/participation.service';

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 30;

@Component({
  selector: 'app-sonar-analysis',
  standalone: true,
  imports: [
    CommonModule,
    QualityGateStatusComponent,
    MetricCardComponent,
    ProgressBarComponent,
    CodeHealthScoreComponent,
    InfoBarComponent,
    DetailedBreakdownComponent
  ],
  template: `
    <div class="min-h-screen bg-[#F9FAFB]">
      <!-- Page Header -->
      <header class="bg-white border-b border-gray-200">
        <div class="w-full px-8 py-6">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <button (click)="handleGoBack()" class="mt-1 p-1 rounded-md hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
                </svg>
              </button>
              <div>
                <h1 class="text-2xl font-semibold text-[#1F2937] mb-1">
                  Code Quality Analysis Report
                </h1>
                <p class="text-sm text-[#6B7280]">
                  Automated static code analysis powered by SonarCloud.
                </p>
              </div>
            </div>
            <div class="text-right text-sm text-[#6B7280]">
              <div>Pull Request: <span class="font-semibold text-[#1F2937]">{{ pullRequestNumber }}</span></div>
              <div class="mt-1">Analyzed At: {{ analyzedAt }}</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Initial loading -->
      <div *ngIf="isLoading && !isWaitingForAnalysis" class="flex flex-col items-center justify-center py-20">
        <div class="w-10 h-10 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-[#6B7280]">Fetching analysis results...</p>
      </div>

      <!-- Waiting for SonarCloud analysis (polling) -->
      <div *ngIf="isWaitingForAnalysis" class="flex flex-col items-center justify-center py-20 px-6">
        <div class="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-10 text-center">
          <div class="w-16 h-16 border-4 border-[#1E3A8A]/20 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 class="text-xl font-semibold text-[#1F2937] mb-2">Analysis in progress</h2>
          <p class="text-[#6B7280] text-sm mb-6">
            SonarCloud is analyzing your code. This usually takes 1–3 minutes. You can check your pull request on GitHub in the meantime.
          </p>
          <p class="text-xs text-[#9CA3AF]">Checking again automatically every 10 seconds… (attempt {{ pollAttempt }}/{{ maxPollAttempts }})</p>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="errorMessage" class="max-w-[600px] mx-auto px-6 py-20 text-center">
        <p class="text-red-500 text-lg mb-4">{{ errorMessage }}</p>
        <button (click)="handleGoBack()" class="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm">Go Back</button>
      </div>

      <!-- Main Content -->
      <main *ngIf="!isLoading && !errorMessage && !isWaitingForAnalysis && data" class="max-w-[1100px] mx-auto px-6 py-10 space-y-10">
        <!-- Earned Points Banner -->
        <section class="relative overflow-hidden rounded-2xl"
          [class]="data.qualityGateStatus === 'PASSED' 
            ? 'bg-gradient-to-r from-[#059669] to-[#10B981]' 
            : 'bg-gradient-to-r from-[#DC2626] to-[#EF4444]'">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div class="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
          <div class="relative px-8 py-8 flex items-center justify-between">
            <div class="flex items-center gap-6">
              <div class="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg class="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                </svg>
              </div>
              <div>
                <p class="text-white/80 text-sm font-medium mb-1">
                  {{ data.qualityGateStatus === 'PASSED' ? 'Congratulations! Challenge Passed' : 'Challenge Not Passed' }}
                </p>
                <h2 class="text-white text-3xl font-bold">You earned {{ earnedPoints }} / {{ maxPoints }} Points</h2>
                <p class="text-white/70 text-sm mt-1">
                  Based on your Code Health Score of {{ data.codeHealthScore }}%
                  {{ data.qualityGateStatus === 'FAILED' ? ' — Score 60% or above to pass' : '' }}
                </p>
              </div>
            </div>
            <div class="text-right hidden lg:block">
              <div class="text-6xl font-extrabold text-white/30">{{ earnedPoints }}</div>
              <div class="text-white/50 text-sm font-medium">PTS</div>
            </div>
          </div>
        </section>

        <!-- Quality Gate Status -->
        <section>
          <app-quality-gate-status [status]="data.qualityGateStatus"></app-quality-gate-status>
        </section>

        <!-- Code Health Score -->
        <section class="bg-white border border-gray-200 rounded-lg">
          <app-code-health-score [score]="data.codeHealthScore"></app-code-health-score>
        </section>

        <!-- Main Metrics Grid -->
        <section class="grid grid-cols-3 gap-6">
          <app-metric-card
            [label]="data.metrics.bugs.label"
            [value]="data.metrics.bugs.value"
            [description]="data.metrics.bugs.description"
            [variant]="data.metrics.bugs.variant || 'neutral'">
          </app-metric-card>
          <app-metric-card
            [label]="data.metrics.vulnerabilities.label"
            [value]="data.metrics.vulnerabilities.value"
            [description]="data.metrics.vulnerabilities.description"
            [variant]="data.metrics.vulnerabilities.variant || 'neutral'">
          </app-metric-card>
          <app-metric-card
            [label]="data.metrics.securityHotspots.label"
            [value]="data.metrics.securityHotspots.value"
            [description]="data.metrics.securityHotspots.description"
            [variant]="data.metrics.securityHotspots.variant || 'neutral'">
          </app-metric-card>
          <app-metric-card
            [label]="data.metrics.codeSmells.label"
            [value]="data.metrics.codeSmells.value"
            [description]="data.metrics.codeSmells.description"
            [variant]="data.metrics.codeSmells.variant || 'neutral'">
          </app-metric-card>
          <app-metric-card
            [label]="data.metrics.testCoverage.label"
            [value]="data.metrics.testCoverage.value"
            [description]="data.metrics.testCoverage.description"
            [variant]="data.metrics.testCoverage.variant || 'neutral'">
          </app-metric-card>
          <app-metric-card
            [label]="data.metrics.codeDuplication.label"
            [value]="data.metrics.codeDuplication.value"
            [description]="data.metrics.codeDuplication.description"
            [variant]="data.metrics.codeDuplication.variant || 'neutral'">
          </app-metric-card>
        </section>

        <!-- Progress Bars -->
        <section class="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
          <app-progress-bar 
            label="Test Coverage" 
            [value]="data.coverage" 
            variant="primary">
          </app-progress-bar>
          <app-progress-bar 
            label="Code Duplication" 
            [value]="data.duplication" 
            variant="warning">
          </app-progress-bar>
        </section>

        <!-- Codebase Information -->
        <section>
          <app-info-bar [items]="data.codebaseInfo"></app-info-bar>
        </section>

        <!-- Detailed Breakdown -->
        <section>
          <app-detailed-breakdown [items]="data.detailedBreakdown"></app-detailed-breakdown>
        </section>
      </main>
    </div>
  `,
  styles: []
})
export class SonarAnalysisComponent implements OnInit, OnDestroy {
  pullRequestNumber = '';
  analyzedAt = '';
  isLoading = true;
  errorMessage = '';
  isWaitingForAnalysis = false;
  pollAttempt = 0;
  maxPollAttempts = MAX_POLL_ATTEMPTS;
  maxPoints = 0;
  earnedPoints = 0;

  private destroy$ = new Subject<void>();
  private stopPolling$ = new Subject<void>();

  data!: AnalysisData;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private participationService: ParticipationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const participationId = params['participationId'];
      if (participationId) {
        this.loadSonarResults(participationId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling$.next();
    this.stopPolling$.complete();
  }

  private loadSonarResults(participationId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.isWaitingForAnalysis = false;
    this.pollAttempt = 0;

    this.participationService.getParticipation(participationId).pipe(
      catchError(() => of(null))
    ).subscribe(participation => {
      if (participation?.challenge) {
        this.maxPoints = participation.challenge.points ?? 0;
      }
    });

    this.participationService.refreshSonarResults(participationId).pipe(
      switchMap(refreshed => of(refreshed as SonarResultResponse)),
      catchError(() => {
        return this.participationService.getSonarResults(participationId).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(result => {
      if (result) {
        this.applyResult(result);
        this.isLoading = false;
      } else {
        this.isLoading = false;
        this.isWaitingForAnalysis = true;
        this.startPolling(participationId);
      }
    });
  }

  private fetchResults(participationId: string): Observable<SonarResultResponse | null> {
    return this.participationService.getSonarResults(participationId).pipe(
      catchError(() => of(null))
    );
  }

  private applyResult(result: SonarResultResponse): void {
    this.pullRequestNumber = `#${result.pullRequestKey}`;
    this.analyzedAt = this.formatDate(result.analyzedAt);
    this.data = this.mapToAnalysisData(result);
    this.earnedPoints = this.calculateEarnedPoints(this.data.codeHealthScore, this.maxPoints);
    this.isWaitingForAnalysis = false;
    this.isLoading = false;
  }

  /**
   * Points formula:
   * - Below 60% health score (failed): earn 10% of max points as participation reward
   * - 60–100% health score (passed): scale linearly from 50% to 100% of max points
   *   e.g. 60% → 50% of points, 80% → 75%, 100% → 100%
   */
  private calculateEarnedPoints(healthScore: number, maxPoints: number): number {
    if (maxPoints <= 0) return 0;
    if (healthScore < 60) {
      return Math.round(maxPoints * 0.1);
    }
    const ratio = 0.5 + ((healthScore - 60) / 40) * 0.5;
    return Math.round(maxPoints * ratio);
  }

  private startPolling(participationId: string): void {
    this.pollAttempt = 0;

    timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS).pipe(
      takeUntil(merge(this.destroy$, this.stopPolling$)),
      switchMap(() => {
        this.pollAttempt++;
        return this.fetchResults(participationId);
      }),
      takeUntil(merge(this.destroy$, this.stopPolling$))
    ).subscribe(result => {
      if (result) {
        this.applyResult(result);
        this.stopPolling$.next();
      } else if (this.pollAttempt >= MAX_POLL_ATTEMPTS) {
        this.stopPolling$.next();
        this.isWaitingForAnalysis = false;
        this.errorMessage = 'Analysis is taking longer than usual. Please check your pull request on GitHub and try again later.';
      }
    });
  }

  private mapToAnalysisData(r: SonarResultResponse): AnalysisData {
    const healthScore = this.calculateHealthScore(r);

    return {
      qualityGateStatus: healthScore >= 60 ? 'PASSED' : 'FAILED',
      codeHealthScore: healthScore,
      metrics: {
        bugs: {
          label: 'Bugs',
          value: r.bugs,
          description: 'Detected logic errors in code.',
          variant: this.getVariant(r.bugs, 0, 5)
        },
        vulnerabilities: {
          label: 'Vulnerabilities',
          value: r.vulnerabilities,
          description: 'Security-related issues detected.',
          variant: this.getVariant(r.vulnerabilities, 0, 3)
        },
        securityHotspots: {
          label: 'Security Hotspots',
          value: r.securityHotspots,
          description: 'Security-sensitive code to review.',
          variant: this.getVariant(r.securityHotspots, 0, 5)
        },
        codeSmells: {
          label: 'Code Smells',
          value: r.codeSmells,
          description: 'Maintainability issues in code.',
          variant: this.getVariant(r.codeSmells, 0, 10)
        },
        testCoverage: {
          label: 'Test Coverage',
          value: `${r.coverage}%`,
          description: 'Percentage of code covered by tests.',
          variant: r.coverage >= 80 ? 'success' : r.coverage >= 50 ? 'warning' : 'error'
        },
        codeDuplication: {
          label: 'Code Duplication',
          value: `${r.duplication}%`,
          description: 'Percentage of duplicated code.',
          variant: r.duplication <= 3 ? 'neutral' : r.duplication <= 10 ? 'warning' : 'error'
        }
      },
      coverage: r.coverage,
      duplication: r.duplication,
      codebaseInfo: [
        { label: 'Lines of Code', value: r.linesOfCode.toLocaleString() },
        { label: 'Pull Request Key', value: `#${r.pullRequestKey}` },
        { label: 'Analyzed At', value: this.formatDate(r.analyzedAt) }
      ],
      detailedBreakdown: [
        { type: 'Bugs', count: r.bugs, severity: r.bugs > 0 ? 'Critical' : 'Info' },
        { type: 'Vulnerabilities', count: r.vulnerabilities, severity: r.vulnerabilities > 0 ? 'Major' : 'Info' },
        { type: 'Code Smells', count: r.codeSmells, severity: r.codeSmells > 10 ? 'Minor' : 'Info' },
        { type: 'Security Hotspots', count: r.securityHotspots, severity: r.securityHotspots > 0 ? 'Review' : 'Info' },
      ]
    };
  }

  private getVariant(value: number, goodThreshold: number, warnThreshold: number): MetricVariant {
    if (value <= goodThreshold) return 'neutral';
    if (value <= warnThreshold) return 'warning';
    return 'error';
  }

  private calculateHealthScore(r: SonarResultResponse): number {
    let score = 100;
    score -= r.bugs * 10;
    score -= r.vulnerabilities * 8;
    score -= r.securityHotspots * 3;
    score -= r.codeSmells * 1;
    score -= Math.max(0, (100 - r.coverage) * 0.2);
    score -= r.duplication * 2;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' – ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  }

  handleGoBack(): void {
    this.router.navigate(['/challenges/active']);
  }
}
