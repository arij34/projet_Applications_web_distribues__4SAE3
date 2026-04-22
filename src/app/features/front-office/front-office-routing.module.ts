import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrontOfficeComponent } from './front-office/front-office.component';
import { RoleGuard } from '../../core/auth/role.guard';
import { KC_ROLES } from '../../core/auth/roles';
import { ProjetClientComponent } from './front-office/components/projet-client/projet-client.component';
import { ProjetFreelancerComponent } from './front-office/components/projet-freelancer/projet-freelancer.component';
import { ProjetDetailComponent } from './front-office/components/projet-detail/projet-detail.component';
import { ProjetFreelancerDetailComponent } from './front-office/components/projet-freelancer-detail/projet-freelancer-detail.component';
import { AddProjectComponent } from './front-office/components/projet-client/add-project/add-project.component';
import { StatsComponent } from './front-office/components/stats/stats.component';
import { ProjetWorkspaceComponent } from './front-office/components/projet-workspace/projet-workspace.component';
import { WorkspaceAccessGuard } from '../../core/guards/workspace-access.guard';
import { PlanningComponent } from '../planningg/planning/planning.component';
import { TaskComponent } from '../planningg/task/task.component';

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
import { ContractsComponent } from './front-office/components/contrat_client/contracts.component';
import { SubscriptionPageComponent } from '../subscription/pages/subscription-page/subscription-page.component';
import { SubscriptionPaymentPageComponent } from '../subscription/pages/subscription-payment-page/subscription-payment-page.component';
const routes: Routes = [
  {
    path: '',
    component: FrontOfficeComponent,
    children: [

      // ── Projet (intégration) ──────────────────────────────────────
      { path: 'projects',              component: ProjetClientComponent },
      { path: 'projects/add',          component: AddProjectComponent },
      { path: 'projects/:id',          component: ProjetDetailComponent },
      {
        path: 'projects/:id/workspace',
        component: ProjetWorkspaceComponent,
        canActivate: [WorkspaceAccessGuard]
      },
      { path: 'discover',              component: ProjetFreelancerComponent },
      { path: 'discover/:id',          component: ProjetFreelancerDetailComponent },
      { path: 'stats',                 component: StatsComponent },
      { path: 'projet-client',         component: ProjetClientComponent },

      // ── Contracts (client view) ───────────────────────────────────────────
      { path: 'contracts',             component: ContractsComponent },

      // ── Planning (FREELANCER only) ───────────────────────────────────────
      {
        path: 'plannings',
        component: PlanningComponent,
        canActivate: [RoleGuard],
        data: { roles: [KC_ROLES.FREELANCER] }
      },
      {
        path: 'tasks',
        component: TaskComponent,
        canActivate: [RoleGuard],
        data: { roles: [KC_ROLES.FREELANCER] }
      },

      // ── Skill Management ──────────────────────────────────────────
      { path: 'dashboard-skill',       component: SkillDashboardComponent },

      // Education
      { path: 'education',             component: EducationListComponent },
      { path: 'education/add',         component: EducationFormComponent },
      { path: 'education/edit/:id',    component: EducationFormComponent },

      // Experience
      { path: 'experience',            component: ExperienceListComponent },
      { path: 'experience/create',     component: ExperienceFormComponent },
      { path: 'experience/edit/:id',   component: ExperienceFormComponent },

      // Availability
      { path: 'availability',          component: AvailabilityListComponent },
      { path: 'availability/add',      component: AvailabilityFormComponent },
      { path: 'availability/edit/:id', component: AvailabilityFormComponent },

      // Freelancer Skills
      { path: 'freelancer-skills',             component: FreelancerSkillListComponent },
      { path: 'freelancer-skills/add',         component: FreelancerSkillFormComponent },
      { path: 'freelancer-skills/edit/:id',    component: FreelancerSkillFormComponent },
      { path: 'freelancer_skills',             component: FreelancerSkillListComponent },
      { path: 'freelancer_skills/add',         component: FreelancerSkillFormComponent },
      { path: 'freelancer_skills/edit/:id',    component: FreelancerSkillFormComponent },
      { path: 'contracts-freelancer',          component: ContratFreelancerComponent },
      { path: 'contracts-freelancer/:id',      component: ContratFreelancerDetailComponent },
      { path: 'subscription',                  component: SubscriptionPageComponent },
      { path: 'subscription/pay',              component: SubscriptionPaymentPageComponent },
      // ✅ AJOUTÉ : Matching — lazy loaded depuis matchingModule
      {
        path: 'matching',
        loadChildren: () =>
          import('./matchingModule/matching.module')
          .then(m => m.MatchingModule)
      },
      {
        path: 'invitations',
        loadChildren: () =>
          import('./invitations/invitations.module')
        .then(m => m.InvitationsModule)
      },
       {
    path: 'projects/:id/invitations',component: ClientProjectInvitationsComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontOfficeRoutingModule { }
