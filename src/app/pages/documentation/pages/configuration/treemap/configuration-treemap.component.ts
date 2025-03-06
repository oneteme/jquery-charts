import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-treemap',
  template: `<section>
    <app-config-section
      title="Treemap Charts"
      [code]="config.basic.code"
      description="Pour visualiser des données hiérarchiques"
      [compatibilityNotes]="[
        '• treemap ↔ heatmap (visualisations alternatives)',
        '• Supporte le groupement de données',
        '• distributed et enableShades sont mutuellement exclusifs'
      ]"
    >
    </app-config-section>
  </section> `,
})
export class ConfigurationTreemapComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.treemap;
  }

  ngOnInit(): void {}
}
