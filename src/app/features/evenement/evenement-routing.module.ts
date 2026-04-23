import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EventComponent } from './event/event.component';
import { ParticipantComponent } from './participant/participant.component';

const routes: Routes = [
  // When mounted at /events, this becomes /events
  { path: '', component: EventComponent },
  // /events/participants
  { path: 'participants', component: ParticipantComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EvenementRoutingModule {}
