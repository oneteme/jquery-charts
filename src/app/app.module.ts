import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { DocumentationComponent } from './features/documentation/documentation.component';
import { ConfigSectionComponent } from './features/documentation/components/config-section/config-section.component';
import { DataSectionComponent } from './features/documentation/components/data-section/data-section.component';
import { GraphTypesSectionComponent } from './features/documentation/components/graph-types-section/graph-types-section.component';
import { HomeComponent } from './layout/home/home.component';
import { ImportantNotesComponent } from './features/documentation/components/important-notes/important-notes.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    HeaderComponent,
    DocumentationComponent,
    ConfigSectionComponent,
    DataSectionComponent,
    GraphTypesSectionComponent,
    HomeComponent,
    ImportantNotesComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, ChartComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
