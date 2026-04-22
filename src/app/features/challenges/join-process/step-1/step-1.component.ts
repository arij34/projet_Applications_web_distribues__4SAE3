import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-1',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-1.component.html',
  styleUrls: ['./step-1.component.css']
})
export class Step1Component {
  @Input() username = '';
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Output() usernameChange = new EventEmitter<string>();
  @Output() continue = new EventEmitter<void>();

  onUsernameChange(): void {
    this.usernameChange.emit(this.username);
  }

  onContinue(): void {
    this.continue.emit();
  }
}
