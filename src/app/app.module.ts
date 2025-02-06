import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartGroupComponent } from './components/chart-group/chart-group.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    ChartGroupComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule,
    ChartComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }