import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../exam.model';

@Component({
  selector: 'app-exam-stats-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-stats-sidebar.component.html',
  styleUrls: ['./exam-stats-sidebar.component.scss'],
})
export class ExamStatsSidebarComponent {
  @Input({ required: true }) questions: Question[] = [];
  @Input({ required: true }) totalPoints = 0;
  @Input({ required: true }) passingScore = 60;

  get totalQuestions(): number { return this.questions.length; }

  get estDuration(): number {
    const map: Record<string, number> = { easy: 2, medium: 4, hard: 7 };
    return this.questions.reduce((sum, q) => sum + (map[q.difficulty] ?? 3), 0);
  }

  get easyCount(): number { return this.questions.filter(q => q.difficulty === 'easy').length; }
  get mediumCount(): number { return this.questions.filter(q => q.difficulty === 'medium').length; }
  get hardCount(): number { return this.questions.filter(q => q.difficulty === 'hard').length; }

  get easyPct(): number { return Math.round((this.easyCount / (this.totalQuestions || 1)) * 100); }
  get mediumPct(): number { return Math.round((this.mediumCount / (this.totalQuestions || 1)) * 100); }
  get hardPct(): number { return Math.round((this.hardCount / (this.totalQuestions || 1)) * 100); }
}
