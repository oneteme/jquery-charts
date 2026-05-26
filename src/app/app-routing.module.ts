import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BasicTestComponent } from './pages/basic-test/basic-test.component';
import { SandboxComponent } from './pages/basic-test/sandbox/sandbox.component';
import { TableShellComponent } from './pages/table/table-shell.component';
import { TableExempleComponent } from './pages/table/table.component';
import { TableTestDocumentationComponent } from './pages/table/documentation/table-documentation.component';
import { TableComparatifComponent } from './pages/table/comparatif/comparatif.component';
import { SliceChartComponent } from './pages/table/slice-chart/slice-chart.component';
import { ChartsShellComponent } from './pages/charts/charts-shell.component';
import { EChartsComponent } from './pages/echarts/echarts.component';
import { EChartsDetailComponent } from './pages/echarts/echarts-detail.component';
import { ApexChartsPageComponent } from './pages/apexcharts/apexcharts.component';
import { ApexChartsDetailComponent } from './pages/apexcharts/apexcharts-detail.component';
import { HighchartsGalleryComponent } from './pages/highcharts/highcharts-gallery.component';
import { HighchartsDetailComponent } from './pages/highcharts/highcharts-detail.component';
import { TablePresentationComponent } from './pages/table/table-presentation.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },

  { path: 'basic-test', component: BasicTestComponent },
  { path: 'basic-test/sandbox', component: SandboxComponent },

  // ─── jquery-table — shell avec tabs ──────────────────────────────────
  {
    path: 'table',
    component: TableShellComponent,
    children: [
      { path: '',              component: TableExempleComponent },
      { path: 'comparatif',    component: TableComparatifComponent },
      { path: 'slice-chart',   component: SliceChartComponent },
      { path: 'documentation', component: TableTestDocumentationComponent },
      { path: 'presentation',  component: TablePresentationComponent },
    ],
  },

  // ─── jquery-charts — shell avec switcher de bibliothèque ─────────────
  {
    path: 'charts',
    component: ChartsShellComponent,
    children: [
      { path: '',                  redirectTo: 'echarts', pathMatch: 'full' },
      { path: 'echarts',           component: EChartsComponent           },
      { path: 'echarts/:type',     component: EChartsDetailComponent     },
      { path: 'highcharts',        component: HighchartsGalleryComponent  },
      { path: 'highcharts/:type',  component: HighchartsDetailComponent   },
      { path: 'apexcharts',        component: ApexChartsPageComponent     },
      { path: 'apexcharts/:type',  component: ApexChartsDetailComponent   },
    ],
  },

  {
    path: 'documentation',
    loadChildren: () =>
      import('./pages/documentation/documentation.module').then(
        (m) => m.DocumentationModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
