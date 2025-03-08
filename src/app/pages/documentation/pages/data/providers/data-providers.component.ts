import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-providers',
  template: `<app-doc-section
    type="data"
    title="Utilisation des Data Providers"
    description="Les Data Providers permettent d'accéder et de manipuler vos données de manière flexible"
    [code]="data.basic.code"
  >
  </app-doc-section>`,
})
export class DataProvidersComponent implements OnInit {
  data: any;

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.providers;
  }
  ngOnInit(): void {}
}
