import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinProcessState, Step } from './models/join-process.model';
import { ParticipationService, ParticipationResponse } from '../../../core/services/participation.service';
import { StepIndicatorComponent } from './step-indicator/step-indicator.component';
import { Step1Component } from './step-1/step-1.component';
import { Step2Component } from './step-2/step-2.component';
import { Step3Component } from './step-3/step-3.component';
import { Step4Component } from './step-4/step-4.component';
import { Step5Component } from './step-5/step-5.component';
import { SuccessStateComponent } from './success-state/success-state.component';

@Component({
  selector: 'app-join-process',
  standalone: true,
  imports: [
    CommonModule,
    StepIndicatorComponent,
    Step1Component,
    Step2Component,
    Step3Component,
    Step4Component,
    Step5Component,
    SuccessStateComponent
  ],
  templateUrl: './join-process.component.html',
  styleUrls: ['./join-process.component.css']
})
export class JoinProcessComponent implements OnInit {
  state: JoinProcessState = {
    currentView: 'steps',
    activeStep: 1,
    challengeId: '',
    githubUsername: '',
    isLoading: false,
    errorMessage: '',
    participationId: '',
    repoUrl: '',
    repoName: '',
    invitationAccepted: false,
    copiedRepo: false,
    copiedCommands: false
  };

  steps: Step[] = [
    { id: 1, title: 'GitHub Username' },
    { id: 2, title: 'Repo Creation' },
    { id: 3, title: 'Accept Invitation' },
    { id: 4, title: 'Clone' },
    { id: 5, title: 'Develop' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private participationService: ParticipationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.state = { ...this.state, challengeId: params['id'] || '' };
    });
  }

  handleUsernameChange(username: string): void {
    this.state = { ...this.state, githubUsername: username, errorMessage: '' };
  }

  handleJoinSubmit(): void {
    const username = this.state.githubUsername.trim();
    if (!username || !this.state.challengeId) return;

    this.state = { ...this.state, isLoading: true, errorMessage: '' };

    this.participationService.checkGitHubUserExists(username)
      .subscribe({
        next: (result) => {
          if (!result.exists) {
            this.state = {
              ...this.state,
              isLoading: false,
              errorMessage: `GitHub user "${username}" does not exist. Please check your username and try again.`
            };
            return;
          }
          this.joinAfterValidation(username);
        },
        error: () => {
          this.state = {
            ...this.state,
            isLoading: false,
            errorMessage: `Could not verify "${username}". The username may be incorrect or GitHub is unavailable. Please check and try again.`
          };
        }
      });
  }

  private joinAfterValidation(username: string): void {
    this.participationService.joinChallenge(this.state.challengeId, username)
      .subscribe({
        next: (response: ParticipationResponse) => {
          this.state = {
            ...this.state,
            isLoading: false,
            participationId: response.id,
            repoUrl: response.repoUrl,
            repoName: response.repoName,
            activeStep: 2
          };
        },
        error: (err) => {
          let message = `The username "${username}" is incorrect or could not be processed. Please check and try again.`;
          if (err.error && typeof err.error === 'string') {
            if (err.error.includes('already joined')) {
              message = 'You have already joined this challenge.';
            } else if (err.error.includes('not active')) {
              message = 'This challenge is not currently active.';
            } else if (err.error.includes('not found')) {
              message = 'Challenge not found.';
            } else {
              message = err.error;
            }
          }
          this.state = { ...this.state, isLoading: false, errorMessage: message };
        }
      });
  }

  handleCheckInvitation(): void {
    if (!this.state.participationId) return;

    this.state = { ...this.state, isLoading: true };

    this.participationService.checkInvitationStatus(this.state.participationId)
      .subscribe({
        next: (response) => {
          this.state = {
            ...this.state,
            isLoading: false,
            invitationAccepted: response.accepted
          };
          if (response.accepted) {
            this.state = { ...this.state, activeStep: 4 };
          }
        },
        error: () => {
          this.state = { ...this.state, isLoading: false };
        }
      });
  }

  handleNext(): void {
    if (this.state.activeStep < 5) {
      this.state = { ...this.state, activeStep: this.state.activeStep + 1 };
    } else {
      this.state = { ...this.state, currentView: 'success' };
    }
  }

  handleBack(): void {
    if (this.state.activeStep > 1) {
      this.state = { ...this.state, activeStep: this.state.activeStep - 1 };
    }
  }

  handleCopyRepo(): void {
    const cloneCmd = `git clone ${this.state.repoUrl}.git`;
    navigator.clipboard.writeText(cloneCmd);
    this.state = { ...this.state, copiedRepo: true };
    setTimeout(() => {
      this.state = { ...this.state, copiedRepo: false };
    }, 2000);
  }

  handleCopyCommands(): void {
    const gitCommands = `git add .\ngit commit -m "Initial solution"\ngit push origin main`;
    navigator.clipboard.writeText(gitCommands);
    this.state = { ...this.state, copiedCommands: true };
    setTimeout(() => {
      this.state = { ...this.state, copiedCommands: false };
    }, 2000);
  }

  handleOpenRepo(): void {
    if (this.state.repoUrl) {
      window.open(this.state.repoUrl, '_blank');
    }
  }

  handleFinish(): void {
    this.router.navigate(['/challenges/progress', this.state.challengeId], {
      queryParams: { participationId: this.state.participationId }
    });
  }
}
