import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-bar',
  template: `<section>
    <app-config-section
      title="Bar Charts"
      [code]="config.basic.code"
      description="Pour comparer des valeurs entre catégories"
      [compatibilityNotes]="[
        '• bar ↔ column (orientation horizontale/verticale)',
        '• Peut utiliser stacked et pivot',
        '• Compatible avec le mode continue'
      ]"
    >
    </app-config-section>
  </section>`,
})
export class ConfigurationBarComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.bar;
  }

  ngOnInit(): void {}
}
