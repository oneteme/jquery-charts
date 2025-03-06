import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-range',
  template: `<section>
    <app-config-section
      title="Range Charts"
      [code]="config.basic.code"
      description="Pour représenter des plages de valeurs"
      [compatibilityNotes]="[
        '• rangeArea ↔ rangeBar ↔ rangeColumn',
        '• Nécessite des données min/max',
        '• Compatible avec le mode horizontal pour rangeBar'
      ]"
    >
    </app-config-section>
  </section>`,
})
export class ConfigurationRangeComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.range;
  }

  ngOnInit(): void {}
}
