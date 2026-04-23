import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-submission-section',
  templateUrl: './submission-section.component.html',
  styleUrls: ['./submission-section.component.css']
})
export class SubmissionSectionComponent {
  @Input() allTasksCompleted: boolean = false;
  @Output() submit = new EventEmitter<string>();

  githubUrl: string = '';

  onSubmit(): void {
    if (this.githubUrl.trim() && this.allTasksCompleted) {
      this.submit.emit(this.githubUrl);
    }
  }

  get canSubmit(): boolean {
    return this.allTasksCompleted && this.githubUrl.trim().length > 0;
  }
}
