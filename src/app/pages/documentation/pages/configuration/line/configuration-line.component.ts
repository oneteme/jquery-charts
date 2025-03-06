import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-line',
  template: `<section>
    <app-config-section
      title="Line Charts"
      [code]="config.basic.code"
      description="Pour visualiser des tendances et évolutions"
      [compatibilityNotes]="[
        '• line ↔ area (avec/sans remplissage)',
        '• Plusieurs styles de courbes disponibles',
        '• Compatible avec le mode continue'
      ]"
    >
    </app-config-section>
  </section>`,
})
export class ConfigurationLineComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.line;
  }

  ngOnInit(): void {}
}
