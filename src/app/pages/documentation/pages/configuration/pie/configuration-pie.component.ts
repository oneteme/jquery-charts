import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-pie',
  template: `<section>
    <app-doc-section
      type="config"
      title="Pie Charts"
      [code]="config.basic.code"
      description="Pour les données circulaires et proportionnelles"
      [compatibilityNotes]="[
        '• pie ↔ donut (même données, avec/sans trou central)',
        '• polar ↔ radar (même données, visualisation différente)',
        '• radialBar (structure de données unique, non interchangeable)'
      ]"
    >
    </app-doc-section>
  </section>`,
})
export class ConfigurationPieComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.pie;
  }

  ngOnInit(): void {}
}
