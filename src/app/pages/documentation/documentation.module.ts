import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DocumentationService } from '../../core/services/documentation.service';
import { DocumentationComponent } from './documentation.component';
import { GettingStartedComponent } from './pages/getting-started/getting-started.component';
import { GraphTypesComponent } from './pages/graph-types/graph-types.component';
import { ConfigurationGlobalComponent } from './pages/configuration/global/configuration-global.component';
import { ConfigurationPieComponent } from './pages/configuration/pie/configuration-pie.component';
import { ConfigurationBarComponent } from './pages/configuration/bar/configuration-bar.component';
import { ConfigurationLineComponent } from './pages/configuration/line/configuration-line.component';
import { ConfigurationTreemapComponent } from './pages/configuration/treemap/configuration-treemap.component';
import { ConfigurationHeatmapComponent } from './pages/configuration/heatmap/configuration-heatmap.component';
import { ConfigurationRangeComponent } from './pages/configuration/range/configuration-range.component';
import { ConfigurationFunnelComponent } from './pages/configuration/funnel/configuration-funnel.component';
import { DataStructureComponent } from './pages/data/structure/data-structure.component';
import { DataProvidersComponent } from './pages/data/providers/data-providers.component';
import { DataFieldsComponent } from './pages/data/fields/data-fields.component';
import { DataValuesComponent } from './pages/data/values/data-values.component';
import { DataCombineComponent } from './pages/data/combine/data-combine.component';
import { DocSectionComponent } from '../../components/documentation/doc-section/doc-section.component';
import { InformationsComponent } from '../../components/documentation/informations/informations.component';
import { BtnViewExamplesComponent } from '../../components/documentation/btn-view-examples/btn-view-examples.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentationComponent,
    children: [
      { path: '', redirectTo: 'getting-started', pathMatch: 'full' },
      { path: 'getting-started', component: GettingStartedComponent },
      { path: 'graph-types', component: GraphTypesComponent },
      {
        path: 'configuration',
        children: [
          { path: '', redirectTo: 'global', pathMatch: 'full' },
          { path: 'global', component: ConfigurationGlobalComponent },
          { path: 'pie', component: ConfigurationPieComponent },
          { path: 'bar', component: ConfigurationBarComponent },
          { path: 'line', component: ConfigurationLineComponent },
          { path: 'treemap', component: ConfigurationTreemapComponent },
          { path: 'heatmap', component: ConfigurationHeatmapComponent },
          { path: 'range', component: ConfigurationRangeComponent },
          { path: 'funnel', component: ConfigurationFunnelComponent },
        ],
      },
      {
        path: 'data',
        children: [
          { path: '', redirectTo: 'structure', pathMatch: 'full' },
          { path: 'structure', component: DataStructureComponent },
          { path: 'providers', component: DataProvidersComponent },
          { path: 'fields', component: DataFieldsComponent },
          { path: 'values', component: DataValuesComponent },
          { path: 'combine', component: DataCombineComponent },
        ],
      },
    ],
  },
];

@NgModule({
  declarations: [
    DocumentationComponent,
    GettingStartedComponent,
    GraphTypesComponent,

    ConfigurationGlobalComponent,
    ConfigurationPieComponent,
    ConfigurationBarComponent,
    ConfigurationLineComponent,
    ConfigurationTreemapComponent,
    ConfigurationHeatmapComponent,
    ConfigurationRangeComponent,
    ConfigurationFunnelComponent,

    DataStructureComponent,
    DataProvidersComponent,
    DataFieldsComponent,
    DataValuesComponent,
    DataCombineComponent,

    DocSectionComponent,
    InformationsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    BtnViewExamplesComponent,
  ],
  providers: [DocumentationService],
})
export class DocumentationModule {}
