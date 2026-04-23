import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { ChallengeFormData, STEPS, Step } from '../../models/challenge.model';
import { slideAnimation } from '@shared/animations/slide.animation';

@Component({
  selector: 'app-challenge-wizard',
  templateUrl: './challenge-wizard.component.html',
  styleUrls: ['./challenge-wizard.component.css'],
  animations: [slideAnimation]
})
export class ChallengeWizardComponent implements OnInit, OnDestroy {
  currentStep = 1;
  steps: Step[] = STEPS;
  formData!: ChallengeFormData;
  showSuccessModal = false;
  createdChallengeId = '';
  submitting = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private challengeStateService: ChallengeStateService,
    private router: Router
  ) {
    this.formData = this.challengeStateService.getFormData();
  }

  ngOnInit(): void {
    this.challengeStateService.formData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ChallengeFormData) => {
        this.formData = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleNext(): void {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  handleBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  handleCancel(): void {
    this.challengeStateService.resetForm();
    this.router.navigate(['/admin/challenges']);
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  handleSaveDraft(): void {
    this.errorMessage = '';
    this.submitting = true;
    this.challengeStateService.saveDraft()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { message: string }) => {
          this.submitting = false;
          alert(response.message);
          this.router.navigate(['/admin/challenges']);
        },
        error: (err: any) => {
          this.submitting = false;
          console.error('Error saving draft:', err);
          this.errorMessage = this.getErrorMessage(err);
        }
      });
  }

  handlePublish(): void {
    this.errorMessage = '';
    this.submitting = true;
    this.challengeStateService.publishChallenge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (challenge: { id?: string }) => {
          this.submitting = false;
          this.createdChallengeId = challenge?.id ? String(challenge.id) : '';
          this.showSuccessModal = true;
        },
        error: (err: any) => {
          this.submitting = false;
          console.error('Error publishing challenge:', err);
          this.errorMessage = this.getErrorMessage(err);
        }
      });
  }

  handleCloseSuccess(): void {
    this.showSuccessModal = false;
    this.createdChallengeId = '';
    this.challengeStateService.resetForm();
    this.currentStep = 1;
    this.router.navigate(['/challenges/wizard']);
  }

  handleViewPage(): void {
    this.showSuccessModal = false;
    this.createdChallengeId = '';
    this.challengeStateService.resetForm();
    this.router.navigate(['/admin/challenges/all']);
  }

  private getErrorMessage(err: any): string {
    const body = err?.error;
    return typeof body === 'string' ? body
      : body?.message || body?.error || (Array.isArray(body?.errors) ? body.errors.join(', ') : null)
      || err?.message || 'An error occurred. Please try again.';
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(
          this.formData.challengeInfo.title &&
          this.formData.challengeInfo.description &&
          this.formData.challengeInfo.category &&
          this.formData.challengeInfo.difficulty &&
          this.formData.challengeInfo.technologies.length > 0
        );
      case 2:
        return !!this.formData.githubData.repositoryUrl;
      case 3:
        return this.formData.tasks.length > 0 &&
               this.formData.tasks.every(task => task.title);
      case 4:
        return !!(
          this.formData.settings.startDate &&
          this.formData.settings.endDate &&
          this.formData.settings.status
        );
      case 5:
        return true;
      default:
        return false;
    }
  }
}
