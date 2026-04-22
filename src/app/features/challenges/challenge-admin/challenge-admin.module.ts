import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { BaseChartDirective } from 'ng2-charts';

// Shared standalone components
import { HeaderComponent as BackofficeHeaderComponent } from '../../back-office/back-office/components/header/header.component';
import { SidebarComponent as BackofficeSidebarComponent } from '../../back-office/back-office/components/sidebar/sidebar.component';

// Components
import { QuickActionCardsComponent } from './components/quick-action-cards/quick-action-cards.component';
import { ChallengesPreviewComponent } from './components/challenges-preview/challenges-preview.component';
import { ParticipantAnalyticsComponent } from './components/participant-analytics/participant-analytics.component';
import { TechnologyChartComponent } from './components/technology-chart/technology-chart.component';
import { DeadlineAnalyticsComponent } from './components/deadline-analytics/deadline-analytics.component';
import { EditChallengeModalComponent } from './components/edit-challenge-modal/edit-challenge-modal.component';
import { ParticipantsModalComponent } from './components/participants-modal/participants-modal.component';
import { ModernChallengesGridComponent } from './components/modern-challenges-grid/modern-challenges-grid.component';
import { SuccessModalComponent } from './components/success-modal/success-modal.component';
import { DeleteConfirmationModalComponent } from './components/delete-confirmation-modal/delete-confirmation-modal.component';
import { ViewChallengeTasksModalComponent } from './components/view-challenge-tasks-modal/view-challenge-tasks-modal.component';

// Pages
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ChallengesPageComponent } from './pages/challenges-page/challenges-page.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent
  },
  {
    path: 'all',
    component: ChallengesPageComponent
  }
];

@NgModule({
  declarations: [
    // Components
    QuickActionCardsComponent,
    ChallengesPreviewComponent,
    ParticipantAnalyticsComponent,
    TechnologyChartComponent,
    DeadlineAnalyticsComponent,
    EditChallengeModalComponent,
    ParticipantsModalComponent,
    ModernChallengesGridComponent,
    SuccessModalComponent,
    DeleteConfirmationModalComponent,
    ViewChallengeTasksModalComponent,
    
    // Pages
    DashboardPageComponent,
    ChallengesPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    BaseChartDirective,
    BackofficeHeaderComponent,
    BackofficeSidebarComponent
  ],
  exports: [
    QuickActionCardsComponent,
    ChallengesPreviewComponent,
    ParticipantAnalyticsComponent,
    TechnologyChartComponent,
    DeadlineAnalyticsComponent,
    EditChallengeModalComponent,
    ParticipantsModalComponent,
    ModernChallengesGridComponent,
    SuccessModalComponent,
    DeleteConfirmationModalComponent,
    ViewChallengeTasksModalComponent
  ]
})
export class ChallengeAdminModule { }
