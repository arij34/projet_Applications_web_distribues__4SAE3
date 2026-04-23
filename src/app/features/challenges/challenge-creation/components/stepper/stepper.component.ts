// src/app/modules/challenge-creation/components/stepper/stepper.component.ts

import { Component, Input } from '@angular/core';
import { Step } from '../../models/challenge.model';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.css']
})
export class StepperComponent {
  @Input() steps: Step[] = [];
  @Input() currentStep: number = 1;

  isCompleted(stepId: number): boolean {
    return this.currentStep > stepId;
  }

  isCurrent(stepId: number): boolean {
    return this.currentStep === stepId;
  }

  isLast(index: number): boolean {
    return index === this.steps.length - 1;
  }
}
