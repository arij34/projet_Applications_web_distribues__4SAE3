import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RoleGuard } from './core/auth/role.guard';
import { KC_ROLES } from './core/auth/roles';
import { NotAuthorizedComponent } from './core/pages/not-authorized/not-authorized.component';
import { SignupComponent } from './core/pages/signup/signup.component';
import { ProfileComponent } from './core/pages/profile/profile.component';
import { SigninComponent } from './core/pages/signin/signin.component';

const routes: Routes = [

  // ADMIN - Challenges
  {
    path: 'admin/challenges',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/challenges/challenge-admin/challenge-admin.module')
      .then(m => m.ChallengeAdminModule)
  },

  // ADMIN
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/back-office/back-office.module')
      .then(m => m.BackOfficeModule)
  },

  // ADMIN DASHBOARD ALIAS
  {
    path: 'dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  // CLIENT
  {
    path: 'client',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.CLIENT] },
    loadChildren: () => import('./features/front-office/front-office.module')
      .then(m => m.FrontOfficeModule)
  },

  // FREELANCER
  {
    path: 'freelancer',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER] },
    loadChildren: () => import('./features/front-office/front-office.module')
      .then(m => m.FrontOfficeModule)
  },

  // EVENTS (FREELANCER)
  {
    path: 'events',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER] },
    loadChildren: () => import('./features/evenement/evenement.module')
      .then(m => m.EvenementModule)
  },

  // NOT AUTHORIZED
  { path: 'not-authorized', component: NotAuthorizedComponent },

  // PUBLIC ROUTES
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SigninComponent },

  // PROFILE (ANY AUTHENTICATED USER)
  {
    path: 'profile',
    canActivate: [RoleGuard],
    component: ProfileComponent
  },

  // CHALLENGES (AUTH REQUIRED)
  {
    path: 'challenges/create',
    redirectTo: 'challenges/wizard',
    pathMatch: 'full'
  },
  {
    path: 'challenges/wizard',
    canActivate: [RoleGuard],
    loadChildren: () => import('./features/challenges/challenge-creation/challenge-creation.module')
      .then(m => m.ChallengeCreationModule)
  },
  {
    path: 'challenges',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER, KC_ROLES.CLIENT] },
    loadChildren: () => import('./features/challenges/challenges.module')
      .then(m => m.ChallengesModule)
  },

  // CLIENT PROJECT
  {
    path: 'projet-client',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.CLIENT] },
    loadChildren: () => import('./features/front-office/front-office.module')
      .then(m => m.FrontOfficeModule)
  },

  // FRONT (MAIN ENTRY)
  {
    path: 'front',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER, KC_ROLES.CLIENT] },
    loadChildren: () => import('./features/front-office/front-office.module')
      .then(m => m.FrontOfficeModule)
  },

  // DEFAULT REDIRECT
  {
    path: '',
    redirectTo: 'front',
    pathMatch: 'full'
  },

  // BACK OFFICE (ADMIN)
  {
    path: 'back-office',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.ADMIN] },
    loadChildren: () => import('./features/back-office/back-office.module')
      .then(m => m.BackOfficeModule)
  },

  // FRONT OFFICE (PROTECTED)
  {
    path: 'front-office',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER, KC_ROLES.CLIENT] },
    loadChildren: () => import('./features/front-office/front-office.module')
      .then(m => m.FrontOfficeModule)
  },

  // BLOG (CLIENT/FREELANCER)
  {
    path: 'blog',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER, KC_ROLES.CLIENT] },
    loadComponent: () => import('./features/blog/pages/blog-management-page.component')
      .then(m => m.BlogManagementPageComponent)
  },
  {
    path: 'blog-analytics',
    canActivate: [RoleGuard],
    data: { roles: [KC_ROLES.FREELANCER, KC_ROLES.CLIENT] },
    loadComponent: () => import('./features/blog/pages/blog-analytics-page.component')
      .then(m => m.BlogAnalyticsPageComponent)
  },

  // FALLBACK
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