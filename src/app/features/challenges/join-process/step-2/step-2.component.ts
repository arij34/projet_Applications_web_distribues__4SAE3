import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-2.component.html',
  styleUrls: ['./step-2.component.css']
})
export class Step2Component {
  @Input() repoUrl = '';
  @Input() repoName = '';
  @Input() username = '';
  @Output() continue = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  onContinue(): void {
    this.continue.emit();
  }

  onBack(): void {
    this.back.emit();
  }
}
