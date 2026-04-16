import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'; // <-- ajout ici
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EventComponent } from './features/event/event.component';

@NgModule({
  declarations: [
    AppComponent,
    EventComponent
  ],
  imports: [
    BrowserModule,
     FormsModule,   
    AppRoutingModule,
    HttpClientModule // <-- utilisé ici
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }