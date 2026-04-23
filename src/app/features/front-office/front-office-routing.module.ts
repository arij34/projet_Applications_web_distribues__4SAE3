import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrontOfficeComponent } from './front-office/front-office.component';
import { ProjetClientComponent } from './front-office/components/projet-client/projet-client.component';
import { ProjetFreelancerComponent } from './front-office/components/projet-freelancer/projet-freelancer.component';
import { ProjetDetailComponent } from './front-office/components/projet-detail/projet-detail.component';
import { ProjetFreelancerDetailComponent } from './front-office/components/projet-freelancer-detail/projet-freelancer-detail.component';
import { AddProjectComponent } from './front-office/components/projet-client/add-project/add-project.component';
import { StatsComponent } from './front-office/components/stats/stats.component';
import { ProjetWorkspaceComponent } from './front-office/components/projet-workspace/projet-workspace.component';
import { WorkspaceAccessGuard } from '../../core/guards/workspace-access.guard';
import { RoleGuard } from '../../core/auth/role.guard';
import { KC_ROLES } from '../../core/auth/roles';

import { SkillDashboardComponent } from './skillManagement/dashboardskill/skill-dashboard/skill-dashboard.component';
import { EducationListComponent } from './skillManagement/education/education-list/education-list.component';
import { EducationFormComponent } from './skillManagement/education/education-form/education-form.component';
import { ExperienceListComponent } from './skillManagement/experience/experience-list/experience-list.component';
import { ExperienceFormComponent } from './skillManagement/experience/experience-form/experience-form.component';
import { AvailabilityListComponent } from './skillManagement/availability/availability-list/availability-list.component';
import { AvailabilityFormComponent } from './skillManagement/availability/availability-form/availability-form.component';
import { FreelancerSkillListComponent } from './skillManagement/freelancer-skill/freelancer-skill-list/freelancer-skill-list.component';
import { FreelancerSkillFormComponent } from './skillManagement/freelancer-skill/freelancer-skill-form/freelancer-skill-form.component';
import { SubscriptionPageComponent } from '../subscription/pages/subscription-page/subscription-page.component';
import { SubscriptionPaymentPageComponent } from '../subscription/pages/subscription-payment-page/subscription-payment-page.component';

const routes: Routes = [
  {
    path: '',
    component: FrontOfficeComponent,
    children: [

      // ← Plus de HomeComponent : FrontOfficeComponent gère lui-même la landing page
      // quand l'URL est exactement /front (voir front-office.component.ts isChildRoute)

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

      // ── Subscription / Payment (CLIENT) ──────────────────────────
      {
        path: 'subscription',
        component: SubscriptionPageComponent,
        canActivate: [RoleGuard],
        data: { roles: [KC_ROLES.CLIENT] }
      },
      {
        path: 'subscription/pay',
        component: SubscriptionPaymentPageComponent,
        canActivate: [RoleGuard],
        data: { roles: [KC_ROLES.CLIENT] }
      },

      // ── Skill Management ──────────────────────────────────────

      { path: 'dashboard-skill',       component: SkillDashboardComponent },

      // Education
      { path: 'education',             component: EducationListComponent },
      { path: 'education/add',         component: EducationFormComponent },   // ✅ retiré /:userId
      { path: 'education/edit/:id',    component: EducationFormComponent },

      // Experience
      { path: 'experience',            component: ExperienceListComponent },
      { path: 'experience/create',     component: ExperienceFormComponent },  // ✅ retiré /:userId
      { path: 'experience/edit/:id',   component: ExperienceFormComponent },

      // Availability
      { path: 'availability',          component: AvailabilityListComponent },
      { path: 'availability/add',      component: AvailabilityFormComponent }, // ✅ retiré /:userId
      { path: 'availability/edit/:id', component: AvailabilityFormComponent },

      // Freelancer Skills
      { path: 'freelancer-skills',             component: FreelancerSkillListComponent },
      { path: 'freelancer-skills/add',         component: FreelancerSkillFormComponent }, // ✅ retiré /:userId
      { path: 'freelancer-skills/edit/:id',    component: FreelancerSkillFormComponent },
      { path: 'freelancer_skills',             component: FreelancerSkillListComponent },
      { path: 'freelancer_skills/add',         component: FreelancerSkillFormComponent }, // ✅ retiré /:userId
      { path: 'freelancer_skills/edit/:id',    component: FreelancerSkillFormComponent },
    ]
    }
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontOfficeRoutingModule { }
