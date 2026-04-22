import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-4',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-4.component.html',
  styleUrls: ['./step-4.component.css']
})
export class Step4Component {
  @Input() repoUrl = '';
  @Input() copied = false;
  @Output() continue = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() copyRepo = new EventEmitter<void>();

  get cloneCommand(): string {
    return `git clone ${this.repoUrl}.git`;
  }

  onContinue(): void {
    this.continue.emit();
  }

  onBack(): void {
    this.back.emit();
  }

  onCopy(): void {
    this.copyRepo.emit();
  }
}
