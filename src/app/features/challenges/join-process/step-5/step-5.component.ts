import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-5',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-5.component.html',
  styleUrls: ['./step-5.component.css']
})
export class Step5Component {
  @Input() copied = false;
  @Output() complete = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() copyCommands = new EventEmitter<void>();

  gitCommands = `git add .
git commit -m "Initial solution"
git push origin main`;

  onComplete(): void {
    this.complete.emit();
  }

  onBack(): void {
    this.back.emit();
  }

  onCopy(): void {
    this.copyCommands.emit();
  }
}
