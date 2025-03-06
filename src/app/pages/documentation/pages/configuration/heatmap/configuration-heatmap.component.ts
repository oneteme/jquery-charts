import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-heatmap',
  template: `<section>
    <app-config-section
      title="Heatmap Charts"
      [code]="config.basic.code"
      description="Pour visualiser l'intensité des données"
      [compatibilityNotes]="[
        '• Compatible avec les échelles de couleurs personnalisées',
        '• Peut être utilisé avec des données matricielles'
      ]"
    >
    </app-config-section>
  </section> `,
})
export class ConfigurationHeatmapComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.heatmap;
  }

  ngOnInit(): void {}
}
