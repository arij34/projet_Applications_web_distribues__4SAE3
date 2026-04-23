// src/app/modules/challenge-creation/components/step2-github/step2-github.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { GitHubData } from '../../models/challenge.model';

@Component({
  selector: 'app-step2-github',
  templateUrl: './step2-github.component.html',
  styleUrls: ['./step2-github.component.css']
})
export class Step2GithubComponent implements OnInit, OnDestroy {
  @Input() data!: GitHubData;
  
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private challengeStateService: ChallengeStateService
  ) {
    this.form = this.fb.group({
      repositoryUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/(www\.)?github\.com\/.+\/.+$/)]],
      orgCreated: [false],
      repoCreated: [false],
      readmeAdded: [false],
      forkEnabled: [false]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        repositoryUrl: this.data.repositoryUrl,
        ...this.data.checklist
      });
    }

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isValidUrl(): boolean {
    const urlControl = this.form.get('repositoryUrl');
    return urlControl?.valid || !urlControl?.value || false;
  }

  private updateState(): void {
    const formValue = this.form.value;
    const updatedData: GitHubData = {
      repositoryUrl: formValue.repositoryUrl,
      checklist: {
        orgCreated: formValue.orgCreated,
        repoCreated: formValue.repoCreated,
        readmeAdded: formValue.readmeAdded,
        forkEnabled: formValue.forkEnabled
      }
    };
    
    this.challengeStateService.updateGitHubData(updatedData);
  }
}
