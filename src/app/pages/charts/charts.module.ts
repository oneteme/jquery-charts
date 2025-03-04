import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartsComponent } from './charts.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'pie',
    pathMatch: 'full',
  },
  { path: ':type', component: ChartsComponent },
];

@NgModule({
  declarations: [ChartsComponent],
  imports: [CommonModule, ChartComponent, RouterModule.forChild(routes)],
})
export class ChartsModule {}
