import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-combine',
  template: `<app-doc-section
    type="data"
    title="Combinaison et agrégation de données"
    [code]="data.basic.code"
    description="Apprenez à combiner et agréger vos données pour des visualisations plus complexes"
  >
  </app-doc-section>`,
})
export class DataCombineComponent {
  data: any;
  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.combine;
  }
}
