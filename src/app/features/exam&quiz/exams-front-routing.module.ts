import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FreelancerExamCatalogComponent } from './components/freelancer-exam-catalog/freelancer-exam-catalog.component';
import { FreelancerExamPreviewComponent } from './components/freelancer-exam-preview/freelancer-exam-preview.component';
import { FreelancerExamSessionComponent } from './components/freelancer-exam-session/freelancer-exam-session.component';
import { FreelancerExamResultComponent } from './components/freelancer-exam-result/freelancer-exam-result.component';
import { RoleGuard } from '../../core/auth/role.guard';

const routes: Routes = [
  { path: '', component: FreelancerExamCatalogComponent },
  { path: ':id/take', component: FreelancerExamSessionComponent, canActivate: [RoleGuard], data: { roles: [] } },
  { path: ':id/result', component: FreelancerExamResultComponent, canActivate: [RoleGuard], data: { roles: [] } },
  { path: ':id', component: FreelancerExamPreviewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExamsFrontRoutingModule {}
