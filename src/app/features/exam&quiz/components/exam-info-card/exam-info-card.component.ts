import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Exam } from '../exam.model';

type EditableExamFields = Pick<
  Exam,
  'title' | 'description' | 'duration' | 'passingScore' | 'maxAttempts' | 'status' | 'type' | 'showResult'
>;

@Component({
  selector: 'app-exam-info-card',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './exam-info-card.component.html',
  styleUrls: ['./exam-info-card.component.scss'],
})
export class ExamInfoCardComponent implements OnChanges {
  @Input({ required: true }) exam!: Exam;
  @Output() examUpdated = new EventEmitter<Exam>();
  @Output() publishClicked = new EventEmitter<void>();

  isEditing = false;
  editError = '';
  draft: EditableExamFields = this.createDraft();

  ngOnChanges(): void {
    if (!this.isEditing) {
      this.draft = this.createDraft();
    }
  }

  private createDraft(): EditableExamFields {
    return {
      title: this.exam?.title ?? '',
      description: this.exam?.description ?? '',
      duration: Number(this.exam?.duration ?? 0),
      passingScore: Number(this.exam?.passingScore ?? 0),
      maxAttempts: Number(this.exam?.maxAttempts ?? 1),
      status: this.exam?.status ?? 'draft',
      type: this.exam?.type ?? 'quiz',
      showResult: Boolean(this.exam?.showResult),
    };
  }

  startEdit(): void {
    this.editError = '';
    this.draft = this.createDraft();
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.editError = '';
    this.isEditing = false;
    this.draft = this.createDraft();
  }

  saveEdit(): void {
    const title = this.draft.title.trim();
    if (!title) {
      this.editError = 'Title is required.';
      return;
    }
    if (this.draft.duration <= 0) {
      this.editError = 'Duration must be greater than 0.';
      return;
    }
    if (this.draft.passingScore < 0 || this.draft.passingScore > 100) {
      this.editError = 'Passing score must be between 0 and 100.';
      return;
    }
    if (this.draft.maxAttempts < 1) {
      this.editError = 'Max attempts must be at least 1.';
      return;
    }

    this.editError = '';
    this.examUpdated.emit({
      ...this.exam,
      ...this.draft,
      title,
      description: this.draft.description.trim(),
      duration: Number(this.draft.duration),
      passingScore: Number(this.draft.passingScore),
      maxAttempts: Number(this.draft.maxAttempts),
    });
    this.isEditing = false;
  }

  onToggleResult(): void {
    if (this.isEditing) return;
    this.examUpdated.emit({ ...this.exam, showResult: !this.exam.showResult });
  }

  onPublish(): void {
    this.publishClicked.emit();
  }
}
