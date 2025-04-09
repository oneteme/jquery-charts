import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
// import { BasicTestComponent } from './pages/basic-test/basic-test.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },

  // uncomment if you want to add the test page
  // { path: 'basic-test', component: BasicTestComponent },
  {
    path: 'documentation',
    loadChildren: () =>
      import('./pages/documentation/documentation.module').then(
        (m) => m.DocumentationModule
      ),
  },
  {
    path: 'charts',
    loadChildren: () =>
      import('./pages/charts/charts.module').then((m) => m.ChartsModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
