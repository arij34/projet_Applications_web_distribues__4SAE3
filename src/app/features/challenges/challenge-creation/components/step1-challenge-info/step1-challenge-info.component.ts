// src/app/modules/challenge-creation/components/step1-challenge-info/step1-challenge-info.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { ChallengeInfo, CATEGORIES, TECH_OPTIONS } from '../../models/challenge.model';

@Component({
  selector: 'app-step1-challenge-info',
  templateUrl: './step1-challenge-info.component.html',
  styleUrls: ['./step1-challenge-info.component.css']
})
export class Step1ChallengeInfoComponent implements OnInit, OnDestroy {
  @Input() data!: ChallengeInfo;
  
  form: FormGroup;
  categories = CATEGORIES;
  techOptions = TECH_OPTIONS;
  maxDescriptionLength = 2000;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private challengeStateService: ChallengeStateService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(this.maxDescriptionLength)]],
      category: ['', Validators.required],
      selectedTech: [''],
      difficulty: ['', Validators.required],
      image: [null]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        title: this.data.title,
        description: this.data.description,
        category: this.data.category,
        difficulty: this.data.difficulty,
        image: this.data.image
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

  get technologies(): string[] {
    return this.data?.technologies || [];
  }

  get availableTechOptions(): string[] {
    return this.techOptions.filter(tech => !this.technologies.includes(tech));
  }

  addTechnology(tech: string): void {
    if (tech && !this.technologies.includes(tech)) {
      const updatedTechnologies = [...this.technologies, tech];
      this.updateState(updatedTechnologies);
      this.form.patchValue({ selectedTech: '' }, { emitEvent: false });
    }
  }

  removeTechnology(tech: string): void {
    const updatedTechnologies = this.technologies.filter(t => t !== tech);
    this.updateState(updatedTechnologies);
  }

  /** Max base64 length ~55KB to fit MySQL TEXT (64KB). JPEG quality adjusted to stay under limit. */
  private readonly MAX_IMAGE_BYTES = 55000;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const dataUrl = e.target?.result as string;
        this.compressImage(dataUrl).then(compressed => {
          this.form.patchValue({ image: compressed });
          this.updateState(undefined, compressed);
        }).catch(() => {
          this.form.patchValue({ image: null });
          this.updateState(undefined, null);
        });
      };
      reader.readAsDataURL(file);
    }
  }

  private compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400;
        const maxH = 300;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const r = Math.min(maxW / w, maxH / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject();
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.75;
        let result = canvas.toDataURL('image/jpeg', quality);
        while (result.length > this.MAX_IMAGE_BYTES && quality > 0.2) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        if (result.length > this.MAX_IMAGE_BYTES) {
          const scale = Math.sqrt(this.MAX_IMAGE_BYTES / result.length);
          canvas.width = Math.max(100, Math.round(w * scale));
          canvas.height = Math.max(75, Math.round(h * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          result = canvas.toDataURL('image/jpeg', 0.6);
        }
        resolve(result);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  removeImage(): void {
    this.form.patchValue({ image: null });
    this.updateState(undefined, null);
  }

  private updateState(technologies?: string[], image?: string | null): void {
    const formValue = this.form.value;
    const updatedData: ChallengeInfo = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      technologies: technologies !== undefined ? technologies : this.technologies,
      difficulty: formValue.difficulty,
      image: image !== undefined ? image : formValue.image
    };
    
    this.challengeStateService.updateChallengeInfo(updatedData);
  }
}
