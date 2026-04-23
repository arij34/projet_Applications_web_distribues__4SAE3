import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChallengeWizardComponent } from './components/challenge-wizard/challenge-wizard.component';

const routes: Routes = [
  {
    path: '',
    component: ChallengeWizardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChallengeCreationRoutingModule { }
