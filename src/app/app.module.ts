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
  ],
  providers: [ChartTypesService],
  bootstrap: [AppComponent],
})
export class AppModule {}
