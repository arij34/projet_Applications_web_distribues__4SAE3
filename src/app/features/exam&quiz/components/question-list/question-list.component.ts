import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ApiAnswer, ApiQuestion } from '../../models/api.models';
import { QuestionService } from '../../services/question.service';
import { Question, Difficulty, QuestionType } from '../exam.model';

interface EditableAnswer {
  id?: string;
  text: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.scss'],
})
export class QuestionListComponent {
  @Input({ required: true }) questions: Question[] = [];
  @Output() questionDeleted = new EventEmitter<string>();
  @Output() questionAdded = new EventEmitter<Question>();
  @Output() questionUpdated = new EventEmitter<Question>();

  constructor(private readonly questionService: QuestionService) {}

  searchTerm = signal('');
  filterDiff = signal<Difficulty | 'all'>('all');
  filterType = signal<QuestionType | 'all'>('all');

  isModalOpen = false;
  isLoadingAnswers = false;
  isSaving = false;
  modalError = '';
  selectedQuestion: Question | null = null;
  deletedAnswerIds: string[] = [];
  editableAnswers: EditableAnswer[] = [];

  editModel: {
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    points: number;
  } = {
    text: '',
    type: 'single_choice',
    difficulty: 'medium',
    points: 1,
  };

  filtered(): Question[] {
    const term = this.searchTerm().toLowerCase();
    return this.questions.filter(q => {
      const matchSearch = !term || q.text.toLowerCase().includes(term);
      const matchDiff = this.filterDiff() === 'all' || q.difficulty === this.filterDiff();
      const matchType = this.filterType() === 'all' || q.type === this.filterType();
      return matchSearch && matchDiff && matchType;
    });
  }

  onSearch(e: Event): void { this.searchTerm.set((e.target as HTMLInputElement).value); }
  onFilterDiff(e: Event): void { this.filterDiff.set((e.target as HTMLSelectElement).value as Difficulty | 'all'); }
  onFilterType(e: Event): void { this.filterType.set((e.target as HTMLSelectElement).value as QuestionType | 'all'); }
  onDelete(id: string): void { this.questionDeleted.emit(id); }

  openQuestionModal(question: Question): void {
    this.selectedQuestion = question;
    this.editModel = {
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      points: question.points,
    };
    this.deletedAnswerIds = [];
    this.editableAnswers = [];
    this.modalError = '';
    this.isModalOpen = true;
    this.loadAnswers(question.id);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isLoadingAnswers = false;
    this.isSaving = false;
    this.modalError = '';
    this.selectedQuestion = null;
    this.editableAnswers = [];
    this.deletedAnswerIds = [];
  }

  addAnswer(): void {
    this.editableAnswers.push({ text: '', isCorrect: false });
  }

  removeAnswer(index: number): void {
    const answer = this.editableAnswers[index];
    if (answer?.id) {
      this.deletedAnswerIds.push(answer.id);
    }
    this.editableAnswers.splice(index, 1);
  }

  markAsCorrect(index: number): void {
    this.editableAnswers = this.editableAnswers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index,
    }));
  }

  saveQuestionChanges(): void {
    if (!this.selectedQuestion || this.isSaving) return;
    this.modalError = '';

    const questionText = this.editModel.text.trim();
    if (!questionText) {
      this.modalError = 'Question text is required.';
      return;
    }

    const normalizedAnswers = this.editableAnswers
      .map((answer) => ({ ...answer, text: answer.text.trim() }))
      .filter((answer) => answer.text.length > 0);

    if (normalizedAnswers.length === 0) {
      this.modalError = 'Add at least one answer.';
      return;
    }

    if (!normalizedAnswers.some((answer) => answer.isCorrect)) {
      this.modalError = 'Select one correct answer.';
      return;
    }

    this.isSaving = true;

    const questionPayload: Partial<ApiQuestion> = {
      questionText,
      questionType: this.toApiQuestionType(this.editModel.type),
      difficultyLevel: this.editModel.difficulty.toUpperCase(),
      points: Number(this.editModel.points),
    };

    this.questionService.updateQuestion(this.selectedQuestion.id, questionPayload).pipe(
      switchMap(() => {
        const operations = [
          ...this.deletedAnswerIds.map((id) => this.questionService.deleteAnswer(id).pipe(map(() => null))),
          ...normalizedAnswers.map((answer) => {
            const payload: Partial<ApiAnswer> = {
              answerText: answer.text,
              isCorrect: answer.isCorrect,
              question: { id: this.selectedQuestion!.id },
            };

            if (answer.id) {
              return this.questionService.updateAnswer(answer.id, payload).pipe(map(() => null));
            }
            return this.questionService.createAnswer(payload).pipe(map(() => null));
          })
        ];

        if (operations.length === 0) return of(null);
        return forkJoin(operations).pipe(map(() => null));
      })
    ).subscribe({
      next: () => {
        if (this.selectedQuestion) {
          this.questionUpdated.emit({
            ...this.selectedQuestion,
            text: questionText,
            type: this.editModel.type,
            difficulty: this.editModel.difficulty,
            points: Number(this.editModel.points),
          });
        }
        this.isSaving = false;
        this.closeModal();
      },
      error: () => {
        this.isSaving = false;
        this.modalError = 'Failed to save question changes.';
      }
    });
  }

  typeLabel(t: QuestionType): string {
    const map: Record<QuestionType, string> = {
      single_choice: 'Single choice',
      multiple_choice: 'Multi choice',
      true_false: 'True / false',
      short_answer: 'Short answer',
    };
    return map[t];
  }

  private loadAnswers(questionId: string): void {
    this.isLoadingAnswers = true;
    this.questionService.getAnswersByQuestionId(questionId).subscribe({
      next: (answers) => {
        this.editableAnswers = answers.map((answer) => ({
          id: answer.id == null ? undefined : String(answer.id),
          text: (answer.answerText ?? answer.text ?? '').trim(),
          isCorrect: Boolean(answer.isCorrect),
        }));

        if (this.editableAnswers.length === 0) {
          this.editableAnswers = [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ];
        }

        this.isLoadingAnswers = false;
      },
      error: () => {
        this.isLoadingAnswers = false;
        this.modalError = 'Failed to load answers for this question.';
      }
    });
  }

  private toApiQuestionType(type: QuestionType): ApiQuestion['questionType'] {
    if (type === 'true_false') return 'TRUE_FALSE';
    if (type === 'short_answer') return 'SHORT';
    return 'MCQ';
  }
}
