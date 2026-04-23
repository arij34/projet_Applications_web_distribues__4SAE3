import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FrontOfficeRoutingModule } from './front-office-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Front-office (intégration)
import { FrontOfficeComponent } from './front-office/front-office.component';
import { ProjetClientComponent } from './front-office/components/projet-client/projet-client.component';
import { AddProjectComponent } from './front-office/components/projet-client/add-project/add-project.component';
import { ProjetFreelancerComponent } from './front-office/components/projet-freelancer/projet-freelancer.component';
import { ProjetDetailComponent } from './front-office/components/projet-detail/projet-detail.component';
import { ProjetFreelancerDetailComponent } from './front-office/components/projet-freelancer-detail/projet-freelancer-detail.component';
import { StatsComponent } from './front-office/components/stats/stats.component';
import { ProposalFilterPipe } from './front-office/components/projet-client/proposal-filter.pipe';
import { ProjetWorkspaceComponent } from './front-office/components/projet-workspace/projet-workspace.component';

// Subscription / Payment
import { SubscriptionPageComponent } from '../subscription/pages/subscription-page/subscription-page.component';
import { SubscriptionPaymentPageComponent } from '../subscription/pages/subscription-payment-page/subscription-payment-page.component';

// Local - Skill Management
import { SkillDashboardComponent } from './skillManagement/dashboardskill/skill-dashboard/skill-dashboard.component';
import { EducationListComponent } from './skillManagement/education/education-list/education-list.component';
import { EducationFormComponent } from './skillManagement/education/education-form/education-form.component';
import { ExperienceListComponent } from './skillManagement/experience/experience-list/experience-list.component';
import { ExperienceFormComponent } from './skillManagement/experience/experience-form/experience-form.component';
import { AvailabilityListComponent } from './skillManagement/availability/availability-list/availability-list.component';
import { AvailabilityFormComponent } from './skillManagement/availability/availability-form/availability-form.component';
import { FreelancerSkillListComponent } from './skillManagement/freelancer-skill/freelancer-skill-list/freelancer-skill-list.component';
import { FreelancerSkillFormComponent } from './skillManagement/freelancer-skill/freelancer-skill-form/freelancer-skill-form.component';

@NgModule({
  declarations: [
    // Intégration
    FrontOfficeComponent,
    ProjetClientComponent,
    AddProjectComponent,
    ProjetFreelancerComponent,
    ProjetDetailComponent,
    ProjetFreelancerDetailComponent,
    StatsComponent,
    ProposalFilterPipe,
    ProjetWorkspaceComponent,

    // Subscription / Payment
    SubscriptionPageComponent,
    SubscriptionPaymentPageComponent,

    // Local - Skill Management
    SkillDashboardComponent,
    EducationListComponent,
    EducationFormComponent,
    ExperienceListComponent,
    ExperienceFormComponent,
    AvailabilityListComponent,
    AvailabilityFormComponent,
    FreelancerSkillListComponent,
    FreelancerSkillFormComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FrontOfficeRoutingModule,
    SharedModule,
  ]
})
export class FrontOfficeModule { }
