import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-3.component.html',
  styleUrls: ['./step-3.component.css']
})
export class Step3Component {
  @Input() isLoading = false;
  @Input() invitationAccepted = false;
  @Output() checkStatus = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  showNotAcceptedWarning = false;

  onCheckStatus(): void {
    this.showNotAcceptedWarning = false;
    this.checkStatus.emit();
  }

  onContinue(): void {
    if (this.invitationAccepted) {
      this.continue.emit();
    } else {
      this.checkStatus.emit();
      this.showNotAcceptedWarning = true;
    }
  }

  onBack(): void {
    this.back.emit();
  }
}
