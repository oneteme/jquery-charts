import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-values',
  template: `
    <section>
      <h2>Utilisation des Values pour les données statiques</h2>

      <div class="introduction">
        <p>
          La fonction <code>values()</code> permet de définir des valeurs statiques
          dans vos configurations de graphiques. C'est un outil très utile pour
          créer des visualisations avec des données fixes ou prédéfinies.
        </p>
        <p>
          Contrairement à <code>field()</code> qui extrait des données dynamiquement,
          <code>values()</code> fournit des valeurs constantes, ce qui est idéal pour
          certains scénarios de visualisation.
        </p>
        <ul>
          <li>Définition de labels, axes et séries avec valeurs constantes</li>
          <li>Compatibilité avec tous types de données (texte, nombre, date)</li>
          <li>Combinable avec <code>field()</code> pour des configurations mixtes</li>
          <li>Particulièrement utile pour les graphiques de type bar et pie</li>
        </ul>
      </div>

      <div class="doc-section">
        <h3>Syntaxe et exemples d'utilisation</h3>
        <p class="section-intro">
          La fonction <code>values()</code> accepte une liste de valeurs qui seront
          utilisées dans l'ordre dans lequel elles sont fournies.
        </p>

        <app-doc-section
          type="data"
          [code]="data.basic.code"
        ></app-doc-section>
      </div>

      <div class="doc-section">
        <h3>Cas d'utilisation courants</h3>
        <div class="types-grid">
          <div class="type-card">
            <h4>Définition de l'axe X</h4>
            <p>
              Idéal pour créer un axe X avec des valeurs prédéfinies, comme des mois,
              des catégories ou des périodes.
            </p>
            <app-doc-section
              type="data"
              [code]="data.axisExample.code"
            ></app-doc-section>
          </div>
          <div class="type-card">
            <h4>Graphiques statiques</h4>
            <p>
              Parfait pour les graphiques entièrement définis dans le code,
              sans source de données externe.
            </p>
            <app-doc-section
              type="data"
              [code]="data.staticChart.code"
            ></app-doc-section>
          </div>
        </div>
      </div>

      <app-informations
        title="À noter"
        [notes]="valuesNotes"
        type="warning"
      >
      </app-informations>
    </section>
  `,
  styles: [
    `
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

      .doc-section {
        margin-bottom: 40px;
      }

      .section-intro {
        font-size: 1.1rem;
        line-height: 1.6;
        color: #5a6b7b;
        margin-bottom: 20px;
      }

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
        margin: 0 0 10px 0;
        color: #5a6b7b;
        line-height: 1.5;
      }

      @media (max-width: 768px) {
        .types-grid {
          grid-template-columns: 1fr;
        }

        h2 {
          font-size: 1.8rem;
        }
      }
    `
  ]
})
export class DataValuesComponent {
  data: any;
  valuesNotes: string[] = [
    '• L\'ordre des valeurs est important - elles sont utilisées selon leur position dans le tableau',
    '• Une erreur est générée si l\'index demandé dépasse le nombre de valeurs fournies',
    '• Pour des scénarios plus dynamiques, combinez values() avec field()'
  ];

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.values;
  }
}