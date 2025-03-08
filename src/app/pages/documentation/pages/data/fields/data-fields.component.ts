import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-fields',
  template: `<app-doc-section
    type="data"
    title="Manipulation des données avec Fields"
    description="Les Fields permettent d'accéder dynamiquement aux propriétés de vos données"
    [code]="data.basic.code"
  >
  </app-doc-section> `,
})
export class DataFieldsComponent {
  data: any;
  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.fields;
  }
}
