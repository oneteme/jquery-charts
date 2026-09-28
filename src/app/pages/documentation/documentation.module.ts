import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DocumentationComponent } from './documentation.component';
import { DocumentationStartComponent } from './pages/start/start.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentationComponent,
    children: [
      { path: '', component: DocumentationStartComponent, pathMatch: 'full' },
      { path: 'prise-en-main', redirectTo: '/demarrer', pathMatch: 'full' },
      { path: 'demarrage', redirectTo: '/demarrer', pathMatch: 'full' },
      { path: 'start', redirectTo: '/demarrer', pathMatch: 'full' },
      { path: 'getting-started', redirectTo: '/demarrer', pathMatch: 'full' },
      { path: 'graph-types', redirectTo: '/charts', pathMatch: 'full' },
      {
        path: 'configuration',
        children: [
          { path: '', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'global', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'pie', redirectTo: '/charts', pathMatch: 'full' },
          { path: 'bar', redirectTo: '/charts', pathMatch: 'full' },
          { path: 'line', redirectTo: '/charts', pathMatch: 'full' },
          { path: 'treemap', redirectTo: '/charts', pathMatch: 'full' },
          { path: 'heatmap', redirectTo: '/charts', pathMatch: 'full' },
          { path: 'range', redirectTo: '/charts', pathMatch: 'full' },
          { path: 'funnel', redirectTo: '/charts', pathMatch: 'full' },
        ],
      },
      {
        path: 'data',
        children: [
          { path: '', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'structure', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'providers', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'fields', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'values', redirectTo: '/api/core', pathMatch: 'full' },
          { path: 'combine', redirectTo: '/api/core', pathMatch: 'full' },
        ],
      },
    ],
  },
];

@NgModule({
  declarations: [
    DocumentationComponent,
    DocumentationStartComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
  ],
})
export class DocumentationModule {}
