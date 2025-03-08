import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-structure',
  template: `<app-doc-section
    type="data"
    title="Structure des données pour les graphiques"
    description="Découvrez les différentes façons de structurer vos données pour les graphiques"
    [code]="data.basic.code"
  >
  </app-doc-section> `,
})
export class DataStructureComponent implements OnInit {
  data: any;

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.structure;
  }

  ngOnInit(): void {}
}
