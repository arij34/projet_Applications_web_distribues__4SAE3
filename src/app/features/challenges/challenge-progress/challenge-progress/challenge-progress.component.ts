import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChallengeService } from '../../../../core/services/challenge.service';
import { ParticipationService } from '../../../../core/services/participation.service';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { ProgressSummaryComponent } from '../progress-summary/progress-summary.component';
import { ProductivityIndicatorComponent } from '../productivity-indicator/productivity-indicator.component';
import { ActivityTimelineComponent, TimelineEvent } from '../activity-timeline/activity-timeline.component';
import { TaskListComponent, Task, TaskStatus } from '../task-list/task-list.component';
import { MotivationBannerComponent } from '../motivation-banner/motivation-banner.component';

@Component({
  selector: 'app-challenge-progress',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CountdownTimerComponent,
    ProgressSummaryComponent,
    ProductivityIndicatorComponent,
    ActivityTimelineComponent,
    TaskListComponent,
    MotivationBannerComponent
  ],
  templateUrl: './challenge-progress.component.html',
  styleUrls: ['./challenge-progress.component.css']
})
export class ChallengeProgressComponent implements OnInit, OnDestroy {
  challengeId = '';
  participationId = '';
  challengeTitle = '';
  participantRepoUrl = '';
  challengePoints = 0;
  deadline!: Date;
  startDate!: Date;
  tasks: Task[] = [];
  timelineEvents: TimelineEvent[] = [];
  isLoading = true;
  isSubmitting = false;
  isCheckingBranch = false;
  showSubmitModal = false;
  submitBranchName = 'main';
  submitError = '';
  submitSuccess = '';
  branchError = '';
  cloneCopied = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengeService: ChallengeService,
    private participationService: ParticipationService
  ) {}

  private onPopState = (event: PopStateEvent) => {
    history.pushState(null, '', location.href);
  };

  ngOnInit(): void {
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', this.onPopState);

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.challengeId = params['id'] || '';
      if (this.challengeId) {
        this.loadChallengeData();
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.onPopState);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChallengeData(): void {
    this.isLoading = true;

    this.challengeService.getChallengeById(this.challengeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (challenge) => {
          this.challengeTitle = challenge.title;
          this.challengePoints = challenge.points ?? 0;
          this.loadParticipation();
          this.deadline = challenge.endDate ? new Date(challenge.endDate) : this.getDefaultDeadline();
          this.startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();

          this.timelineEvents = [
            { id: '1', label: 'Challenge started', timestamp: this.formatDate(this.startDate), icon: 'repo' },
            { id: '2', label: 'You joined the challenge', timestamp: 'Just now', icon: 'commit' },
          ];

          this.loadTasks();
        },
        error: () => {
          this.deadline = this.getDefaultDeadline();
          this.isLoading = false;
        }
      });
  }

  private loadTasks(): void {
    this.challengeService.getTasksByChallengeId(this.challengeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendTasks) => {
          this.tasks = backendTasks
            .filter(t => t.title && t.title.trim())
            .map(t => ({
              id: t.idTask || t.id || '',
              title: t.title || '',
              description: t.description || '',
              status: this.mapBackendStatus(t.status),
              estimatedTime: this.estimateTime(t.deadline),
            }));
          this.isLoading = false;
        },
        error: () => {
          this.tasks = [];
          this.isLoading = false;
        }
      });
  }

  private mapBackendStatus(status?: string): TaskStatus {
    if (!status) return 'incomplete';
    const s = status.toUpperCase();
    if (s === 'COMPLETED' || s === 'COMPLETE' || s === 'DONE') return 'completed';
    if (s === 'INPROGRESS' || s === 'IN_PROGRESS' || s === 'IN-PROGRESS') return 'in-progress';
    return 'incomplete';
  }

  private estimateTime(deadline?: string | Date): string {
    if (!deadline) return '-';
    const end = new Date(deadline);
    const now = new Date();
    const diffHours = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60)));
    if (diffHours >= 24) return `${Math.ceil(diffHours / 24)}d`;
    return `${diffHours}h`;
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  private getDefaultDeadline(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  handleTaskToggle(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus: TaskStatus;
    if (task.status === 'incomplete') {
      newStatus = 'in-progress';
    } else if (task.status === 'in-progress') {
      newStatus = 'completed';
    } else {
      newStatus = 'incomplete';
    }

    const backendStatus = newStatus === 'completed' ? 'COMPLETED'
      : newStatus === 'in-progress' ? 'INPROGRESS' : 'INCOMPLETE';

    this.challengeService.updateTaskStatus(taskId, backendStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tasks = this.tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
          );
        },
        error: () => {
          this.tasks = this.tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
          );
        }
      });
  }

  get completedTasks(): number {
    return this.tasks.filter(t => t.status === 'completed').length;
  }

  get inProgressTasks(): number {
    return this.tasks.filter(t => t.status === 'in-progress').length;
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  get progressPercentage(): number {
    if (this.totalTasks === 0) return 0;
    return Math.round((this.completedTasks / this.totalTasks) * 100);
  }

  get daysLeft(): number {
    if (!this.deadline) return 0;
    return Math.ceil((this.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  handleGoBack(): void {
    this.router.navigate(['/challenges/active']);
  }

  private loadParticipation(): void {
    this.participationService.getMyParticipationForChallenge(this.challengeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.participationId = p.id;
          this.participantRepoUrl = p.repoUrl ?? '';
        }
      });
  }

  handleViewRepository(): void {
    if (this.participantRepoUrl) {
      window.open(this.participantRepoUrl, '_blank');
    }
  }

  handleSubmitChallenge(): void {
    if (!this.participationId) return;
    this.submitError = '';
    this.submitSuccess = '';
    this.branchError = '';
    this.showSubmitModal = true;
  }

  onConfirmSubmit(): void {
    const branch = this.submitBranchName.trim();
    if (!branch) {
      this.branchError = 'Please enter a branch name.';
      return;
    }

    this.branchError = '';
    this.submitError = '';
    this.isCheckingBranch = true;

    this.participationService.checkBranchExists(this.participantRepoUrl, branch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isCheckingBranch = false;
          if (!res.exists) {
            this.branchError = `Branch "${branch}" was not found in your repository. Please verify the branch name and make sure you've pushed your changes.`;
            return;
          }
          this.proceedWithSubmit(branch);
        },
        error: () => {
          this.isCheckingBranch = false;
          this.proceedWithSubmit(branch);
        }
      });
  }

  private proceedWithSubmit(branch: string): void {
    this.isSubmitting = true;
    this.submitError = '';

    this.participationService.submitChallenge(this.participationId, branch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.submitSuccess = res.message || 'Challenge submitted successfully!';
          if (res.pullRequestUrl) {
            window.open(res.pullRequestUrl, '_blank');
          }
          setTimeout(() => {
            this.showSubmitModal = false;
            this.router.navigate(['/challenges/analysis', this.participationId]);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = err?.error?.message || err?.error?.error || 'Failed to submit challenge. Please try again.';
        }
      });
  }

  onCancelSubmit(): void {
    this.showSubmitModal = false;
    this.submitError = '';
    this.submitSuccess = '';
    this.branchError = '';
  }

  onSubmitModalOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancelSubmit();
    }
  }

  copyCloneCommand(): void {
    const cmd = `git clone ${this.participantRepoUrl}.git`;
    navigator.clipboard.writeText(cmd).then(() => {
      this.cloneCopied = true;
      setTimeout(() => this.cloneCopied = false, 2000);
    });
  }
}
