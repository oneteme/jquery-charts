import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-global',
  template: `<section>
    <h2>Introduction à la configuration de chaque type de graphiques</h2>
    <div class="introduction">
      <ul class="intro-points">
        <li *ngFor="let note of configNotes2" [innerHTML]="note"></li>
      </ul>
    </div>
    <app-doc-section
      type="config"
      title="Configuration - Structure de base"
      [code]="config.basic.code"
    >
    </app-doc-section>

    <app-informations
      [notes]="configNotes1"
      title="Notes importantes"
      type="warning"
    >
    </app-informations>
  </section> `,
  styleUrls: ['./configuration-global.component.scss'],
})
export class ConfigurationGlobalComponent {
  configNotes1: string[];
  configNotes2: string[];
  config: any;

  constructor(private docService: DocumentationService) {
    this.configNotes1 = this.docService.configGlobalNotes1;
    this.configNotes2 = this.docService.configGlobalNotes2;
    this.config = this.docService.configs.global;
  }
}
