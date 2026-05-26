import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChartTypesService } from './core/services/chart-types.service';
import { FooterComponent } from './components/footer/footer.component';
import { BackToDocButtonComponent } from './components/back-to-doc-button/back-to-doc-button.component';
import { BasicTestComponent } from './pages/basic-test/basic-test.component';
import { TableExempleComponent } from './pages/table/table.component';
import { TableShellComponent } from './pages/table/table-shell.component';
import { ChartsShellComponent } from './pages/charts/charts-shell.component';
import { ApexChartsPageComponent } from './pages/apexcharts/apexcharts.component';
import { EChartsComponent } from './pages/echarts/echarts.component';
import { HighchartsGalleryComponent } from './pages/highcharts/highcharts-gallery.component';
import { EChartsDetailComponent } from './pages/echarts/echarts-detail.component';
import { HighchartsDetailComponent } from './pages/highcharts/highcharts-detail.component';
import { ApexChartsDetailComponent } from './pages/apexcharts/apexcharts-detail.component';
import { QuickSearchComponent } from './components/quick-search/quick-search.component';
import { TablePresentationComponent } from './pages/table/table-presentation.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    BackToDocButtonComponent,
    BasicTestComponent,
    TableExempleComponent,
    TableShellComponent,
    ChartsShellComponent,
    ApexChartsPageComponent,
    EChartsComponent,
    HighchartsGalleryComponent,
    EChartsDetailComponent,
    HighchartsDetailComponent,
    ApexChartsDetailComponent,
    QuickSearchComponent,
    TablePresentationComponent,
  ],
  providers: [ChartTypesService],
  bootstrap: [AppComponent],
})
export class AppModule {}
