import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BadgeComponent } from './components/badge/badge.component';
import { ButtonComponent } from './components/button/button.component';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { LogoSliderComponent } from './components/logo-slider/logo-slider.component';
import { FooterComponent } from './components/footer/footer.component';


@NgModule({

  declarations: [
    BadgeComponent,
    ButtonComponent,
    HeaderComponent,
    NavigationComponent,
    LogoSliderComponent,
     FooterComponent

  ],

  imports: [
    CommonModule,
    RouterModule
  ],

  exports: [
    BadgeComponent,
    ButtonComponent,
    HeaderComponent,
    NavigationComponent,
    LogoSliderComponent,
    FooterComponent

  ]

})
export class SharedModule { }
