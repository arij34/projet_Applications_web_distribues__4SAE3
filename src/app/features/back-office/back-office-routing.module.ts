import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackOfficeComponent } from './back-office/back-office.component';

const routes: Routes = [
  {
    path: '',
    component: BackOfficeComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: BackOfficeComponent },
      { path: 'projects', component: BackOfficeComponent },
      { path: 'contracts', component: BackOfficeComponent },
      { path: 'skills', component: BackOfficeComponent },
      { path: 'challenges', component: BackOfficeComponent },
      { path: 'roadmap', component: BackOfficeComponent },
      { path: 'users', component: BackOfficeComponent },
      { path: 'settings', component: BackOfficeComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackOfficeRoutingModule { }