import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BackOfficeComponent } from './back-office/back-office.component';
import { DashboardViewComponent } from './back-office/components/views/dashboard-view/dashboard-view.component';
import { ProjectsViewComponent } from './back-office/components/views/projects-view/projects-view.component';
import { ContractsViewComponent } from './back-office/components/views/contracts-view/contracts-view.component';
import { UsersViewComponent } from './back-office/components/views/users-view/users-view.component';
import { StatsViewComponent } from './back-office/components/views/stats-view/stats-view.component';

// Local - Skill Management
import { SkillListComponent } from './skillManagement/skill/skill-list/skill-list.component';
import { SkillFormComponent } from './skillManagement/skill/skill-form/skill-form.component';
import { PendingSkillListComponent } from './skillManagement/pending-skill/pending-skill-list/pending-skill-list.component';
import { PendingSkillFormComponent } from './skillManagement/pending-skill/pending-skill-form/pending-skill-form.component';

import { MatchingAdminViewComponent } from './back-office/components/views/matching-admin-view/MatchingAdminViewComponent';


const routes: Routes = [
  {
    path: '',
    component: BackOfficeComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Intégration
      { path: 'dashboard',   component: DashboardViewComponent },
      { path: 'projects',    component: ProjectsViewComponent },
      { path: 'contracts',   component: ContractsViewComponent },
      { path: 'users',       component: UsersViewComponent },
      { path: 'stats',       component: StatsViewComponent },
      // 🔹 NOUVELLE VUE ADMIN MATCHING / INVITATIONS
      { path: 'matching-admin', component: MatchingAdminViewComponent },

      // Local - Skill Management
      { path: 'skills',                component: SkillListComponent },
      { path: 'skills/form',           component: SkillFormComponent },
      { path: 'skills/form/:id',       component: SkillFormComponent },
      { path: 'pending-skills',        component: PendingSkillListComponent },
      { path: 'pending-skills/form',   component: PendingSkillFormComponent },
      { path: 'pending-skills/form/:id', component: PendingSkillFormComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackOfficeRoutingModule { }
