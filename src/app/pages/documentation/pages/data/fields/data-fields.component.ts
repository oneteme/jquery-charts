import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-fields',
  template: `<app-data-section
    title="Manipulation des données avec Fields"
    description="Les Fields permettent d'accéder dynamiquement aux propriétés de vos données"
    [code]="data.basic.code"
  >
  </app-data-section> `,
})
export class DataFieldsComponent implements OnInit {
  data: any;

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.fields;
  }

  ngOnInit(): void {}
}
