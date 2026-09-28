import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ChartWorkbenchComponent } from './pages/basic-test/basic-test.component';
import { TableShellComponent } from './pages/table/table-shell.component';
import { TableExempleComponent } from './pages/table/table.component';
import { TableComparatifComponent } from './pages/table/comparatif/comparatif.component';
import { SliceChartComponent } from './pages/table/slice-chart/slice-chart.component';
import { ChartsShellComponent } from './pages/charts/charts-shell.component';
import { EChartsComponent } from './pages/echarts/echarts.component';
import { EChartsApiComponent } from './pages/echarts/api/echarts-api.component';
import { HighchartsApiComponent } from './pages/highcharts/api/highcharts-api.component';
import { EChartsDetailComponent } from './pages/echarts/echarts-detail.component';
import { ApexChartsPageComponent } from './pages/apexcharts/apexcharts.component';
import { ApexChartsDetailComponent } from './pages/apexcharts/apexcharts-detail.component';
import { HighchartsGalleryComponent } from './pages/highcharts/highcharts-gallery.component';
import { HighchartsDetailComponent } from './pages/highcharts/highcharts-detail.component';
import { TablePresentationComponent } from './pages/table/table-presentation.component';
import { SnapshotsComponent } from './pages/snapshots/snapshots.component';
import { OrganizerDocumentationComponent } from './pages/organizer/organizer-documentation.component';
import { OrganizerApiComponent } from './pages/organizer/api/organizer-api.component';
import { CoreApiComponent } from './pages/core-api/core-api.component';
import { ApexChartsApiComponent } from './pages/apexcharts/api/apexcharts-api.component';
import { TableApiComponent } from './pages/table/api/table-api.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'produit', component: HomeComponent, pathMatch: 'full' },
  { path: 'product', redirectTo: 'produit', pathMatch: 'full' },

  { path: 'basic-test', redirectTo: 'atelier', pathMatch: 'full' },
  { path: 'atelier-graphiques', redirectTo: 'atelier', pathMatch: 'full' },
  { path: 'atelier', component: ChartWorkbenchComponent, pathMatch: 'full' },
  { path: 'snapshots', component: SnapshotsComponent },
  { path: 'api/echarts', component: EChartsApiComponent },
  { path: 'api/highcharts', component: HighchartsApiComponent },
  { path: 'organizer', component: OrganizerDocumentationComponent },
  { path: 'api/organizer', component: OrganizerApiComponent },
  { path: 'api/core', component: CoreApiComponent },
  { path: 'api/apexcharts', component: ApexChartsApiComponent },
  { path: 'api/table', component: TableApiComponent },
  // jquery-table — shell avec tabs
  {
    path: 'table',
    component: TableShellComponent,
    children: [
      { path: '', component: TableExempleComponent },
      { path: 'comparatif', component: TableComparatifComponent },
      { path: 'slice-chart', component: SliceChartComponent },
      { path: 'documentation', redirectTo: '/api/table', pathMatch: 'full' },
      { path: 'presentation', component: TablePresentationComponent },
    ],
  },

  // jquery-charts — shell avec switcher de bibliothèque
  {
    path: 'charts',
    component: ChartsShellComponent,
    children: [
      { path: '', redirectTo: 'echarts', pathMatch: 'full' },
      { path: 'echarts', component: EChartsComponent },
      { path: 'echarts/:type', component: EChartsDetailComponent },
      { path: 'highcharts', component: HighchartsGalleryComponent },
      { path: 'highcharts/:type', component: HighchartsDetailComponent },
      { path: 'apexcharts', component: ApexChartsPageComponent },
      { path: 'apexcharts/:type', component: ApexChartsDetailComponent },
    ],
  },

  {
    path: 'demarrer',
    loadChildren: () =>
      import('./pages/documentation/documentation.module').then(
        (m) => m.DocumentationModule
      ),
  },
  { path: 'prise-en-main', redirectTo: 'demarrer', pathMatch: 'full' },
  { path: 'documentation', redirectTo: 'demarrer', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent, data: { notFound: true } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
