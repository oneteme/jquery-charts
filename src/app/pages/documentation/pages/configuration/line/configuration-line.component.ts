import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-line',
  template: `<section>
    <app-doc-section
      type="config"
      title="Line Charts"
      [code]="config.basic.code"
      description="Pour visualiser des tendances et évolutions"
      [compatibilityNotes]="[
        '• line ↔ area (avec/sans remplissage)',
        '• Plusieurs styles de courbes disponibles',
        '• Compatible avec le mode continue'
      ]"
    >
    </app-doc-section>
  </section>`,
})
export class ConfigurationLineComponent {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.line;
  }
}
