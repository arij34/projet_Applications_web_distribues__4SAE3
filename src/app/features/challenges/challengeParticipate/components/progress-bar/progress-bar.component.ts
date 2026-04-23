import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent {
  @Input() completed: number = 0;
  @Input() total: number = 0;

  get percentage(): number {
    return this.total > 0 ? Math.round((this.completed / this.total) * 100) : 0;
  }
}
