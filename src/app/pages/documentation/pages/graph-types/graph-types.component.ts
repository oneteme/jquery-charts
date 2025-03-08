import { Component } from '@angular/core';
import { DocumentationService } from '../../../../core/services/documentation.service';

@Component({
  selector: 'app-graph-types',
  templateUrl: './graph-types.component.html',
  styleUrls: ['./graph-types.component.scss'],
})
export class GraphTypesComponent {
  infoGeneralNotes: string[];
  graphTypes: any;
  configs: any;
  datas: any;

  constructor(private docService: DocumentationService) {
    this.infoGeneralNotes = this.docService.infoGeneralNotes;
    this.graphTypes = this.docService.graphTypes;
    this.configs = this.docService.configs;
    this.datas = this.docService.datas;
  }
}
