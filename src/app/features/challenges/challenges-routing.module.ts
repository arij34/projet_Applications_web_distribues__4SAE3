import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExploreChallengesComponent } from './userChallengeList/explore-challenges/explore-challenges.component';
import { JoinProcessComponent } from './join-process/join-process.component';
import { ChallengeProgressComponent } from './challenge-progress/challenge-progress/challenge-progress.component';
import { ActiveChallengeComponent } from './active-challenge/active-challenge.component';
import { SonarAnalysisComponent } from './analyse-sonar/components/sonar-analysis/sonar-analysis.component';

const routes: Routes = [
  {
    path: '',
    component: ExploreChallengesComponent
  },
  {
    path: 'active',
    component: ActiveChallengeComponent
  },
  {
    path: 'join/:id',
    component: JoinProcessComponent
  },
  {
    path: 'progress/:id',
    component: ChallengeProgressComponent
  },
  {
    path: 'analysis/:participationId',
    component: SonarAnalysisComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChallengesRoutingModule { }
