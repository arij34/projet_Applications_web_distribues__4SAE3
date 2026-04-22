import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Exam } from '../../models/exam.model';

@Component({
  selector: 'app-exam-dashboard-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './exam-dashboard-card.component.html',
  styleUrls: ['./exam-dashboard-card.component.css']
})
export class ExamDashboardCardComponent {
  @Input({ required: true }) exam!: Exam;
  @Input() passRate: number | null = null;
  @Output() viewParticipants = new EventEmitter<Exam>();
  @Output() cardClicked = new EventEmitter<Exam>();

  get participants(): number {
    return this.exam.attempts ?? 0;
  }

  get stackAvatars(): string[] {
    const pool = ['AS', 'BK', 'CM', 'DL', 'EF', 'GH', 'IJ', 'KL'];
    return pool.slice(0, Math.min(4, this.participants));
  }

  get extraParticipants(): number {
    return Math.max(0, this.participants - 4);
  }

  get passRateColor(): string {
    if (this.passRate === null) return '#9aa0b0';
    if (this.passRate >= 80) return '#059669';
    if (this.passRate >= 60) return '#4584f4';
    return '#dc2626';
  }

  get typeKey(): string {
    return (this.exam.type ?? '').toLowerCase();
  }

  get statusKey(): string {
    const raw = (this.exam.status ?? '').toLowerCase();
    return raw === 'active' ? 'published' : raw;
  }

  onCardClick(): void {
    this.cardClicked.emit(this.exam);
  }
}
