import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventComponent } from './features/event/event.component';

const routes: Routes = [
  {
    path: 'front',
    loadChildren: () =>
      import('./features/front-office/front-office.module')
        .then(m => m.FrontOfficeModule)
  },
  {
    path: 'back-office',
    loadChildren: () =>
      import('./features/back-office/back-office.module')
        .then(m => m.BackOfficeModule)
  },
  {
    path: 'events',
    component: EventComponent
  },
  {
    path: '',
    redirectTo: 'events',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'back-office'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }