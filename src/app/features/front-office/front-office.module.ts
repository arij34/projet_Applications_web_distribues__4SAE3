import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrontOfficeRoutingModule } from './front-office-routing.module';
import { FrontOfficeComponent } from './front-office/front-office.component';
import { SharedModule } from '../../shared/shared.module';  // 👈 add this


@NgModule({
  declarations: [
    FrontOfficeComponent
  ],
  imports: [
    CommonModule,
    FrontOfficeRoutingModule,
    SharedModule   
  ]
})
export class FrontOfficeModule { }
