import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-bar',
  template: `<section>
    <app-doc-section
      type="config"
      title="Bar Charts"
      [code]="config.basic.code"
      description="Pour comparer des valeurs entre catégories"
      [compatibilityNotes]="[
        '• bar ↔ column (orientation horizontale/verticale)',
        '• Peut utiliser stacked et pivot',
        '• Compatible avec le mode continue'
      ]"
    >
    </app-doc-section>
  </section>`,
})
export class ConfigurationBarComponent {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.bar;
  }
}
