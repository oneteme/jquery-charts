import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-structure',
  template: `
    <section>
      <h2>Structure des données</h2>

      <div class="introduction">
        <p>
          La bibliothèque jquery-charts utilise un modèle de données
          standardisé, cohérent pour tous les types de graphiques. Cette
          approche vous permet de structurer vos données de manière intuitive et
          flexible.
        </p>
        <p>
          Comprendre cette structure est essentiel pour tirer pleinement parti
          de la bibliothèque et créer rapidement des visualisations riches et
          interactives.
        </p>
        <ul>
          <li>Organisation claire en collections et objets de données</li>
          <li>Types adaptés aux différents besoins de visualisation</li>
          <li>Formats flexibles pour sources de données diverses</li>
          <li>Séparation propre entre données brutes et configuration</li>
        </ul>
      </div>

      <div class="doc-section">
        <h3>Formats de données brutes</h3>
        <p class="section-intro">
          jquery-charts accepte différents formats de données source, des plus
          simples aux plus complexes.
        </p>

        <div class="tabs-container">
          <div class="tabs-header">
            <button
              class="tab-button"
              [class.active]="activeTab === 'simple-data'"
              (click)="switchTab('simple-data')"
            >
              Données simples
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab === 'complex-data'"
              (click)="switchTab('complex-data')"
            >
              Données complexes
            </button>
          </div>
          <div id="simple-data" class="tab-content" [class.active]="activeTab === 'simple-data'">
            <h4>Objets avec propriétés directes</h4>
            <p>
              Format idéal pour les graphiques simples comme les pie ou
              les barres.
            </p>
            <app-doc-section
              type="code"
              [code]="data.simpleData.code"
            ></app-doc-section>
          </div>
          <div id="complex-data" class="tab-content"  [class.active]="activeTab === 'complex-data'">
            <h4>Structures imbriquées et multi-séries</h4>
            <p>Pour des visualisations plus riches et des analyses croisées.</p>
            <app-doc-section
              type="code"
              [code]="data.complexData.code"
            ></app-doc-section>
          </div>
        </div>
      </div>

      <app-informations
        title="Exemples concrets"
        [notes]="structureNotes"
        type="tip"
      >
      </app-informations>
    </section>
  `,
  styleUrls: ['./data.structure.component.scss'],
})
export class DataStructureComponent {
  data: any;
  activeTab: string = 'simple-data';
  structureNotes: string[] = [
    '• Des exemples concrets pour chaque type de graphique sont disponibles depuis la page /charts ou vous pourrez également consulter le code lié à chaque exemple',
    "• Consultez la documentation spécifique pour chaque type de graphique pour voir comment structurer vos données selon le cas d'usage",
    '• Les pages suivantes vous montreront comment manipuler ces données avec les fonctions field(), values() ou encore joinFields()',
  ];

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.structure;
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }
}