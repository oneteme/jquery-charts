import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-treemap',
  template: `<section>
    <app-doc-section
      type="config"
      title="Treemap Charts"
      [code]="config.basic.code"
      description="Pour visualiser des données hiérarchiques"
      [compatibilityNotes]="[
        '• treemap ↔ heatmap (visualisations alternatives)',
        '• Supporte le groupement de données',
        '• distributed et enableShades sont mutuellement exclusifs'
      ]"
    >
    </app-doc-section>
  </section> `,
})
export class ConfigurationTreemapComponent {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.treemap;
  }
}
