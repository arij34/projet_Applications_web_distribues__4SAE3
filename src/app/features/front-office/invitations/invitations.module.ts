// ========== invitations.module.ts ==========
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http'; // ✅ ajouter

import { ProjectInvitationsComponent } from './project-invitations.component';

const routes: Routes = [
  { path: '', component: ProjectInvitationsComponent }
];

@NgModule({
  declarations: [
    ProjectInvitationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule, // ✅ ajouter
    RouterModule.forChild(routes)
  ]
})
export class InvitationsModule { }

