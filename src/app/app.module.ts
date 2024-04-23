import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ChartComponent } from '@oneteme/jquery-apexcharts';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ChartComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
