import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ChallengeCreationRoutingModule } from './challenge-creation-routing.module';
import { ChallengeWizardComponent } from './components/challenge-wizard/challenge-wizard.component';
import { StepperComponent } from './components/stepper/stepper.component';
import { Step1ChallengeInfoComponent } from './components/step1-challenge-info/step1-challenge-info.component';
import { Step2GithubComponent } from './components/step2-github/step2-github.component';
import { Step3TasksComponent } from './components/step3-tasks/step3-tasks.component';
import { Step4SettingsComponent } from './components/step4-settings/step4-settings.component';
import { Step5ReviewComponent } from './components/step5-review/step5-review.component';
import { SuccessModalComponent } from './components/success-modal/success-modal.component';

@NgModule({
  declarations: [
    ChallengeWizardComponent,
    StepperComponent,
    Step1ChallengeInfoComponent,
    Step2GithubComponent,
    Step3TasksComponent,
    Step4SettingsComponent,
    Step5ReviewComponent,
    SuccessModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    ChallengeCreationRoutingModule
  ]
})
export class ChallengeCreationModule { }
