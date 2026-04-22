import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-state.component.html',
  styleUrls: ['./success-state.component.css']
})
export class SuccessStateComponent {
  @Input() repoUrl = '';
  @Input() repoName = '';
  @Input() copied = false;
  @Output() copyRepo = new EventEmitter<void>();
  @Output() openRepo = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>();

  onOpenRepo(): void {
    this.openRepo.emit();
  }

  onCopy(): void {
    this.copyRepo.emit();
  }

  onFinish(): void {
    this.finish.emit();
  }
}
