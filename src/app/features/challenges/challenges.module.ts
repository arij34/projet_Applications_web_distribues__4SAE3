import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChallengesRoutingModule } from './challenges-routing.module';
import { SharedModule } from '@shared/shared.module';

// Components
import { ChallengesListComponent } from './components/challenges-list/challenges-list.component';
import { ChallengeFiltersComponent } from './components/challenge-filters/challenge-filters.component';
import { ChallengeSearchComponent } from './components/challenge-search/challenge-search.component';

@NgModule({
  declarations: [
    ChallengesListComponent,
    ChallengeFiltersComponent,
    ChallengeSearchComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChallengesRoutingModule,
    SharedModule
  ]
})
export class ChallengesModule { }
