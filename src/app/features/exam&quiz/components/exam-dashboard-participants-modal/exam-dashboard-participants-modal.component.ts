import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Exam } from '../../models/exam.model';

interface Participant {
  initials: string;
  name: string;
  email: string;
  score: number | null;
}

@Component({
  selector: 'app-exam-dashboard-participants-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-dashboard-participants-modal.component.html',
  styleUrls: ['./exam-dashboard-participants-modal.component.css']
})
export class ExamDashboardParticipantsModalComponent {
  @Input() exam: Exam | null = null;
  @Output() closed = new EventEmitter<void>();

  get isOpen(): boolean {
    return !!this.exam;
  }

  get participants(): Participant[] {
    if (!this.exam) return [];
    const count = Math.max(0, Math.min(7, this.exam.attempts || 0));
    return Array.from({ length: count }).map((_, i) => ({
      initials: ['AS', 'BK', 'CM', 'DL', 'EF', 'GH', 'IJ'][i % 7],
      name: `Student ${i + 1}`,
      email: `student${i + 1}@university.edu`,
      score: i % 5 === 0 ? null : 55 + ((i * 9) % 40)
    }));
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }

  scoreClass(score: number | null): string {
    if (score === null) return 'pending';
    return score >= 60 ? 'pass' : 'fail';
  }
}
