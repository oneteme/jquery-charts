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
        <div class="types-grid">
          <div class="type-card">
            <h4>PieChartData & BarChartData</h4>
            <p>
              <code>ChartData&lt;string, number&gt;</code><br />
              Représentent des catégories (chaînes) associées à des valeurs
              numériques.
            </p>
          </div>
          <div class="type-card">
            <h4>LineChartData</h4>
            <p>
              <code>ChartData&lt;string, number&gt;</code><br />
              Pour les graphiques linéaires montrant l'évolution de valeurs
              numériques.
            </p>
          </div>
          <div class="type-card">
            <h4>RangeChartData</h4>
            <p>
              <code>ChartData&lt;XaxisType, number[]&gt;</code><br />
              Pour visualiser des plages de valeurs (min/max).
            </p>
          </div>
          <div class="type-card">
            <h4>TreemapChartData & HeatmapChartData</h4>
            <p>
              <code>ChartData&lt;XaxisType, YaxisType&gt;</code><br />
              Pour les représentations hiérarchiques et matrices de chaleur.
            </p>
          </div>
        </div>
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
              class="tab-button active"
              onclick="switchTab(event, 'simple-data')"
            >
              Données simples
            </button>
            <button
              class="tab-button"
              onclick="switchTab(event, 'complex-data')"
            >
              Données complexes
            </button>
          </div>
          <div id="simple-data" class="tab-content active">
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
          <div id="complex-data" class="tab-content">
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

    <script>
      function switchTab(event, tabId) {
        // Masquer tous les contenus d'onglets
        const tabContents = document.getElementsByClassName('tab-content');
        for (let i = 0; i < tabContents.length; i++) {
          tabContents[i].classList.remove('active');
        }

        // Désactiver tous les boutons d'onglets
        const tabButtons = document.getElementsByClassName('tab-button');
        for (let i = 0; i < tabButtons.length; i++) {
          tabButtons[i].classList.remove('active');
        }

        // Afficher l'onglet demandé et activer le bouton correspondant
        document.getElementById(tabId).classList.add('active');
        event.currentTarget.classList.add('active');
      }
    </script>
  `,
  styles: [
    `
      /* Styles pour les titres */
      h2 {
        margin-bottom: 2rem;
        color: #2c3e50;
        font-size: 2rem;
      }

      h3, h4 {
        color: #34495e;
      }

      h3 {
        margin: 2rem 0 1rem;
      }

      h4 {
        margin-top: 0;
        margin-bottom: 12px;
      }

      /* Bloc d'introduction */
      .introduction {
        margin-bottom: 2rem;
        padding: 2rem;
        background: linear-gradient(to right, #ffffff, #f8f9fa);
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        position: relative;
        border: 1px solid rgba(52, 152, 219, 0.1);
      }

      .introduction::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(to right, #1423dc, #96cd32);
        border-radius: 12px 12px 0 0;
      }

      .introduction p {
        margin-bottom: 1.2rem;
        line-height: 1.7;
        color: #2c3e50;
        font-size: 1.1rem;
      }

      .introduction p:last-of-type {
        margin-bottom: 1rem;
      }

      .introduction ul {
        margin: 0;
        padding-left: 1.5rem;
        display: grid;
        gap: 0.8rem;
      }

      .introduction li {
        color: #34495e;
        line-height: 1.6;
        position: relative;
        padding-left: 1.5rem;
      }

      .introduction li::before {
        content: '→';
        position: absolute;
        left: -5px;
        color: #96cd32;
        font-weight: bold;
      }

      /* Grille des types */
      .types-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin: 24px 0 30px;
      }

      .type-card {
        padding: 16px;
        background-color: #f8f9fc;
        border-radius: 6px;
        border-left: 4px solid #4aa3a2;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
      }

      .type-card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .type-card p {
        margin: 0;
        color: #5a6b7b;
        line-height: 1.5;
      }

      /* Système d'onglets */
      .tabs-container {
        margin: 24px 0 30px;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .tabs-header {
        display: flex;
        background-color: #f1f5f9;
      }

      .tab-button {
        flex: 1;
        padding: 12px 10px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 15px;
        font-weight: 500;
        color: #64748b;
        transition: all 0.2s;
        border-bottom: 3px solid transparent;
      }

      .tab-button:hover {
        background-color: rgba(74, 163, 162, 0.08);
        color: #4aa3a2;
      }

      .tab-button.active {
        color: #4aa3a2;
        border-bottom-color: #4aa3a2;
        background-color: #fff;
      }

      .tab-content {
        padding: 20px;
        display: none;
        background-color: #fff;
      }

      .tab-content.active {
        display: block;
      }

      /* Styles génériques */
      .doc-section {
        margin-bottom: 40px;
      }

      .section-intro {
        font-size: 1.1rem;
        line-height: 1.6;
        color: #5a6b7b;
        margin-bottom: 20px;
      }

      code {
        background: #f1f1f1;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.95em;
      }

      /* Media queries */
      @media (max-width: 768px) {
        .types-grid {
          grid-template-columns: 1fr;
        }

        h2 {
          font-size: 1.8rem;
        }
      }
    `,
  ],
})
export class DataStructureComponent {
  data: any;
  structureNotes: string[] = [
    '• Des exemples concrets pour chaque type de graphique sont disponibles depuis la page /charts ou vous pourrez également consulter le code lié à chaque exemple',
    "• Consultez la documentation spécifique pour chaque type de graphique pour voir comment structurer vos données selon le cas d'usage",
    '• Les pages suivantes vous montreront comment manipuler ces données avec les fonctions field(), values() ou encore joinFields()',
  ];

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.structure;
  }

  ngAfterViewInit() {
    const script = document.createElement('script');
    script.innerHTML = `
      function switchTab(event, tabId) {
        const tabContents = document.getElementsByClassName("tab-content");
        for (let i = 0; i < tabContents.length; i++) {
          tabContents[i].classList.remove("active");
        }
        
        const tabButtons = document.getElementsByClassName("tab-button");
        for (let i = 0; i < tabButtons.length; i++) {
          tabButtons[i].classList.remove("active");
        }
        
        document.getElementById(tabId).classList.add("active");
        event.currentTarget.classList.add("active");
      }
    `;
    document.body.appendChild(script);
  }
}