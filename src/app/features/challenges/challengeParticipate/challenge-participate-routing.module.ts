import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChallengeParticipateComponent } from './challenge-participate.component';

const routes: Routes = [
  {
    path: '',
    component: ChallengeParticipateComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChallengeParticipateRoutingModule { }
