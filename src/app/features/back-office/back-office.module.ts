import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackOfficeRoutingModule } from './back-office-routing.module';
import { BackOfficeComponent } from './back-office/back-office.component';
import {HeaderComponent} from './back-office/components/header/header.component';
import {SidebarComponent} from './back-office/components/sidebar/sidebar.component';
import {DashboardViewComponent} from './back-office/components/views/dashboard-view/dashboard-view.component';
import {ContractsViewComponent} from './back-office/components/views/contracts-view/contracts-view.component';
import {ProjectsViewComponent} from './back-office/components/views/projects-view/projects-view.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    BackOfficeComponent,
    HeaderComponent,
    SidebarComponent,
    DashboardViewComponent,
    ContractsViewComponent,
    ProjectsViewComponent
    
  ],
  imports: [
    CommonModule,
    BackOfficeRoutingModule,
     FormsModule
  ]
})
export class BackOfficeModule { }
