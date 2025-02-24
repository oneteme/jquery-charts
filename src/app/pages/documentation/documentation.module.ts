// src/app/pages/documentation/documentation.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DocumentationComponent } from './documentation.component';
import { ConfigSectionComponent } from '../../components/documentation/config-section/config-section.component';
import { DataSectionComponent } from '../../components/documentation/data-section/data-section.component';
import { GraphTypesSectionComponent } from '../../components/documentation/graph-types-section/graph-types-section.component';
import { InformationsComponent } from '../../components/documentation/informations/informations.component';

const routes: Routes = [
  { path: '', component: DocumentationComponent }
];

@NgModule({
  declarations: [
    DocumentationComponent,
    ConfigSectionComponent,
    DataSectionComponent,
    GraphTypesSectionComponent,
    InformationsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DocumentationModule { }
