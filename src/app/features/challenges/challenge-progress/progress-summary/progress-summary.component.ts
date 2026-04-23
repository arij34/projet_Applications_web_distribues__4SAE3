import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-summary.component.html',
  styleUrls: ['./progress-summary.component.css']
})
export class ProgressSummaryComponent {
  @Input() completedTasks: number = 0;
  @Input() totalTasks: number = 0;
  @Input() inProgressTasks: number = 0;
  @Input() pointsAvailable: number = 0;

  get progressPercentage(): number {
    return this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
  }

  get incompleteTasks(): number {
    return this.totalTasks - this.completedTasks - this.inProgressTasks;
  }

  get estimatedTimeRemaining(): number {
    return this.incompleteTasks * 2; // 2 hours per task estimate
  }

  get progressWidth(): string {
    return `${this.progressPercentage}%`;
  }
}
