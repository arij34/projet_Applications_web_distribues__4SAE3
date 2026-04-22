import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChallengeParticipateRoutingModule } from './challenge-participate-routing.module';

// Components
import { ChallengeParticipateComponent } from './challenge-participate.component';
import { HeaderComponent } from './components/header/header.component';
import { ChallengeHeaderComponent } from './components/challenge-header/challenge-header.component';
import { CountdownTimerComponent } from './components/countdown-timer/countdown-timer.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskFilterTabsComponent } from './components/task-filter-tabs/task-filter-tabs.component';
import { SubmissionSectionComponent } from './components/submission-section/submission-section.component';

@NgModule({
  declarations: [
    ChallengeParticipateComponent,
    HeaderComponent,
    CountdownTimerComponent,
    ProgressBarComponent,
    TaskListComponent,
    TaskFilterTabsComponent,
    SubmissionSectionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ChallengeParticipateRoutingModule,
    ChallengeHeaderComponent
  ],
  exports: [
    ChallengeParticipateComponent
  ]
})
export class ChallengeParticipateModule { }
