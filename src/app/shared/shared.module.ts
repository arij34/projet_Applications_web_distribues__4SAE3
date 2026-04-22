import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { BadgeComponent } from './components/badge/badge.component';
import { ButtonComponent } from './components/button/button.component';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { LogoSliderComponent } from './components/logo-slider/logo-slider.component';
import { FooterComponent } from './components/footer/footer.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

@NgModule({
  declarations: [
    BadgeComponent,
    ButtonComponent,
    HeaderComponent,
    NavigationComponent,
    LogoSliderComponent,
    FooterComponent,
    NotificationBellComponent,
    SearchBarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
  ],
  exports: [
    BadgeComponent,
    ButtonComponent,
    HeaderComponent,
    NavigationComponent,
    LogoSliderComponent,
    FooterComponent,
    NotificationBellComponent,
    SearchBarComponent,
    CommonModule,   
    RouterModule,   
  ]
})
export class SharedModule { }