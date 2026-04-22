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
import { ContractsComponent } from './front-office/components/contrat_client/contracts.component';

// ✅ Signature Modal 
import { SignatureModalComponent } from './components/signature-modal/signature-modal.component';
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
import { ClientProjectInvitationsComponent } from './client-project-invitations/client-project-invitations.component';
import { ContratFreelancerComponent } from './front-office/components/contrat-freelancer/contrat-freelancer.component';
import { ContratFreelancerDetailComponent } from './front-office/components/contrat-freelancer-detail/contrat-freelancer-detail.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { SubscriptionPageComponent } from '../subscription/pages/subscription-page/subscription-page.component';
import { SubscriptionPaymentPageComponent } from '../subscription/pages/subscription-payment-page/subscription-payment-page.component';
import { PlanningComponent } from '../planningg/planning/planning.component';
import { TaskComponent } from '../planningg/task/task.component';
import { QRCodeModule } from 'angularx-qrcode';
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
ContractsComponent,
    SignatureModalComponent,

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
    ContratFreelancerComponent,
    ContratFreelancerDetailComponent,
    ClientProjectInvitationsComponent,
    SubscriptionPageComponent,
    SubscriptionPaymentPageComponent,
    PlanningComponent,
    TaskComponent

  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FrontOfficeRoutingModule,
    SharedModule,
     OverlayModule,
    PortalModule,
    QRCodeModule,
  ]
})
export class FrontOfficeModule { }
