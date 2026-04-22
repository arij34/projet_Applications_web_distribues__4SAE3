import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Step } from '../models/join-process.model';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-indicator.component.html',
  styleUrls: ['./step-indicator.component.css']
})
export class StepIndicatorComponent {
  @Input() steps: Step[] = [];
  @Input() currentStep = 1;
}
