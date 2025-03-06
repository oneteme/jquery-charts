import { Component, OnInit } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-funnel',
  template: `<section>
    <app-config-section
      title="Funnel Charts"
      [code]="config.basic.code"
      description="Pour visualiser des processus par étapes"
      [compatibilityNotes]="[
        '• funnel ↔ pyramid',
        '• Ne supporte pas le pivot',
        '• Configuration spécifique pour le goulot'
      ]"
    >
    </app-config-section>
  </section>`,
})
export class ConfigurationFunnelComponent implements OnInit {
  config: any;

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.funnel;
  }

  ngOnInit(): void {}
}
