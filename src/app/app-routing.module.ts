import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from './core/auth/role.guard';
import { KC_ROLES } from './core/auth/roles';
import { NotAuthorizedComponent } from './core/pages/not-authorized/not-authorized.component';
import { SignupComponent } from './core/pages/signup/signup.component';
import { ProfileComponent } from './core/pages/profile/profile.component';
import { SigninComponent } from './core/pages/signin/signin.component';

const routes: Routes = [

  // Challenge admin (must be before 'admin' to avoid being swallowed by it)
  {
    path: 'admin/challenges',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/challenges/challenge-admin/challenge-admin.module').then(m => m.ChallengeAdminModule)
  },
  {
    path: 'admin/exam-quiz',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/exam&quiz/exam-quiz.module').then(m => m.ExamQuizModule)
  },

  // Role-based entry points
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/back-office/back-office.module').then(m => m.BackOfficeModule)
  },
  {
    path: 'client',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.CLIENT] },
    loadChildren: () => import('./features/front-office/front-office.module').then(m => m.FrontOfficeModule)
  },
  {
    path: 'freelancer',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER] },
    loadChildren: () => import('./features/front-office/front-office.module').then(m => m.FrontOfficeModule)
  },

  // Events (FREELANCER only)
  {
    path: 'events',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER] },
    loadChildren: () => import('./features/evenement/evenement.module').then(m => m.EvenementModule)
  },

  // Planning shortcuts (freelancer front-office)
  { path: 'plannings', redirectTo: 'front-office/plannings', pathMatch: 'full' },
  { path: 'tasks', redirectTo: 'front-office/tasks', pathMatch: 'full' },

  { path: 'not-authorized', component: NotAuthorizedComponent },

  // Local signup form (creates user in Keycloak + DB)
  { path: 'signup', component: SignupComponent },

  // Local sign-in page (redirects to Keycloak, offers IdP + reset password)
  { path: 'signin', component: SigninComponent },

  // Current user profile (works for all logged-in roles)
  // NOTE: allow any authenticated user to view /profile.
  // Some users may not have a realm role yet (e.g. first social login before choosing role).
  { path: 'profile', canActivate: [RoleGuard], component: ProfileComponent },

  {
    path: 'challenges/create',
    redirectTo: 'challenges/wizard',
    pathMatch: 'full'
  },
  {
    path: 'challenges/wizard',
    loadChildren: () => import('./features/challenges/challenge-creation/challenge-creation.module').then(m => m.ChallengeCreationModule)
  },
  {
    path: 'challenges',
    loadChildren: () => import('./features/challenges/challenges.module').then(m => m.ChallengesModule)
  },
  {
    path: 'exams',
    loadChildren: () => import('./features/exams-front.module').then(m => m.ExamsFrontModule)
  },
 {
  path: 'projet-client',
  canActivate: [RoleGuard],
  data: { roles: [KC_ROLES.CLIENT] },
  loadChildren: () => import('./features/front-office/front-office.module')
    .then(m => m.FrontOfficeModule)
},
  {
    path: 'front',
    loadChildren: () =>
      import('./features/front-office/front-office.module')
      .then(m => m.FrontOfficeModule)
  },

  {
    path: '',
    redirectTo: 'front',
    pathMatch: 'full'
  },

  // Keep existing route, but protect it as ADMIN dashboard by default
  {
    path: 'back-office',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/back-office/back-office.module').then(m => m.BackOfficeModule)
  },
  {
    path: 'front-office',
    loadChildren: () => import('./features/front-office/front-office.module').then(m => m.FrontOfficeModule)
  },
  { 
    path: '**', 
    redirectTo: 'front' 
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
