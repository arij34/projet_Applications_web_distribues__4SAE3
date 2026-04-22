import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { ChallengeInfo, GitHubData, Task, SettingsData } from '../../models/challenge.model';

@Component({
  selector: 'app-step5-review',
  templateUrl: './step5-review.component.html',
  styleUrls: ['./step5-review.component.css']
})
export class Step5ReviewComponent {
  @Input() challengeInfo!: ChallengeInfo;
  @Input() githubData!: GitHubData;
  @Input() tasks: Task[] = [];
  @Input() settings!: SettingsData;
  @Output() editStep = new EventEmitter<number>();

  onEditStep(step: number): void {
    this.editStep.emit(step);
  }
}
