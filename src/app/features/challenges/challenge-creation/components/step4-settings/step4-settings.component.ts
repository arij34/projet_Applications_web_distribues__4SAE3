import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { SettingsData } from '../../../../../core/models/challenge.model';

@Component({
  selector: 'app-step4-settings',
  templateUrl: './step4-settings.component.html',
  styleUrls: ['./step4-settings.component.css']
})
export class Step4SettingsComponent implements OnInit, OnDestroy {
  @Input() data!: SettingsData;
  
  form: FormGroup;
  private destroy$ = new Subject<void>();
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private challengeStateService: ChallengeStateService
  ) {
    this.form = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      maxParticipants: [''],
      points: [''],
      status: ['draft', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue(this.data);
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

  get warning(): string | null {
    const startDate = this.form.value.startDate;
    const endDate = this.form.value.endDate;
    
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return 'End date must be after start date';
    }
    
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Challenge duration is less than 1 day';
    }
    
    return null;
  }

  get durationDays(): number | null {
    const startDate = this.form.value.startDate;
    const endDate = this.form.value.endDate;
    
    if (!startDate || !endDate || this.warning) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private updateState(): void {
    const formValue = this.form.value;
    this.challengeStateService.updateSettings(formValue);
  }
}