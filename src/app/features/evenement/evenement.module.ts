import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EvenementRoutingModule } from './evenement-routing.module';
import { EventComponent } from './event/event.component';
import { ParticipantComponent } from './participant/participant.component';

@NgModule({
  declarations: [EventComponent, ParticipantComponent],
  imports: [CommonModule, FormsModule, EvenementRoutingModule]
})
export class EvenementModule {}
