import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FreelancerMatchingListComponent } from './freelancer-matching-list.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

const routes: Routes = [
  {
    path: '',
    component: FreelancerMatchingListComponent
  }
];

@NgModule({
  declarations: [
    FreelancerMatchingListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes) // ✅ TRÈS IMPORTANT
  ]
})
export class MatchingModule { }