import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';

import { BackOfficeRoutingModule } from './back-office-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Intégration
import { BackOfficeComponent } from './back-office/back-office.component';
import { HeaderComponent } from './back-office/components/header/header.component';
import { SidebarComponent } from './back-office/components/sidebar/sidebar.component';
import { DashboardViewComponent } from './back-office/components/views/dashboard-view/dashboard-view.component';
import { ContractsViewComponent } from './back-office/components/views/contracts-view/contracts-view.component';
import { ProjectsViewComponent } from './back-office/components/views/projects-view/projects-view.component';
import { UsersViewComponent } from './back-office/components/views/users-view/users-view.component';
import { StatsViewComponent } from './back-office/components/views/stats-view/stats-view.component';
import { DeleteRequestsComponent } from './back-office/components/views/projects-view/delete-requests/delete-requests.component';

// Local - Skill Management
import { SkillListComponent } from './skillManagement/skill/skill-list/skill-list.component';
import { SkillFormComponent } from './skillManagement/skill/skill-form/skill-form.component';
import { PendingSkillListComponent } from './skillManagement/pending-skill/pending-skill-list/pending-skill-list.component';
import { PendingSkillFormComponent } from './skillManagement/pending-skill/pending-skill-form/pending-skill-form.component';
import { MatchingAdminViewComponent } from './back-office/components/views/matching-admin-view/MatchingAdminViewComponent';
import { SubscriptionsViewComponent } from './back-office/components/views/subscriptions-view/subscriptions-view.component';
import { SubscriptionStatsViewComponent } from './back-office/components/views/subscription-stats-view/subscription-stats-view.component';
@NgModule({
  declarations: [
    // Intégration
    BackOfficeComponent,
    DashboardViewComponent,
    ContractsViewComponent,
    ProjectsViewComponent,
    UsersViewComponent,
    StatsViewComponent,
    DeleteRequestsComponent,

    // Local - Skill Management
    SkillListComponent,
    SkillFormComponent,
    PendingSkillListComponent,
    PendingSkillFormComponent,
    MatchingAdminViewComponent,
    SubscriptionsViewComponent,
    SubscriptionStatsViewComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BackOfficeRoutingModule,
    SharedModule,
    BaseChartDirective,
    SidebarComponent,   // standalone
    HeaderComponent,    // standalone
  ],
  exports: [
    SidebarComponent,
  ]
})
export class BackOfficeModule { }
