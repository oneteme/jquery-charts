import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartGroupComponent } from './components/chart-group/chart-group.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { DocumentationComponent } from './features/documentation/documentation.component';
import { HomeComponent } from './components/home/home.component';
import { ChartViewComponent } from './components/chart-view/chart-view.component';

import { ChartService } from './core/services/chart.service';

@NgModule({
  declarations: [
    AppComponent,
    ChartGroupComponent,
    SidebarComponent,
    HeaderComponent,
    DocumentationComponent,
    HomeComponent,
    ChartViewComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, ChartComponent],
  providers: [ChartService],
  bootstrap: [AppComponent],
})
export class AppModule {}
