import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-values',
  template: `<app-data-section
    title="Utilisation des Values pour les données statiques"
    description="Les Values sont utilisées pour définir des données fixes ou prédéfinies"
    [code]="data.basic.code"
  >
  </app-data-section> `,
})
export class DataValuesComponent implements OnInit {
  data: any;

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.values;
  }

  ngOnInit(): void {}
}
