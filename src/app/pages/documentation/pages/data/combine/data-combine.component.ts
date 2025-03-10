import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-combine',
  template: `
    <section>
      <h2>Combinaison et agrégation de données</h2>

      <div class="introduction">
        <p>
          La bibliothèque jquery-charts fournit des fonctions puissantes pour
          combiner et agréger vos données. Ces fonctionnalités sont essentielles
          pour créer des visualisations avancées à partir de structures de
          données complexes.
        </p>
        <p>
          Les fonctions comme <code>joinFields()</code> et
          <code>combineFields()</code> vous permettent de fusionner des valeurs
          provenant de différentes propriétés de vos objets de données.
        </p>
        <ul>
          <li>Création de labels composites à partir de plusieurs champs</li>
          <li>Agrégation de valeurs pour des visualisations synthétiques</li>
          <li>Transformation de structures de données complexes</li>
          <li>Personnalisation avancée des mappings de données</li>
        </ul>
      </div>

      <div class="doc-section">
        <h3>Fonctions de combinaison</h3>
        <p class="section-intro">
          Découvrez comment utiliser les fonctions de combinaison pour créer des
          visualisations plus riches et informatives.
        </p>

        <app-doc-section
          type="data"
          title="Exemples de combinaison de données"
          description="Combinaison de champs pour des visualisations avancées"
          [code]="data.basic.code"
        ></app-doc-section>
      </div>

      <div class="doc-section">
        <h3>Cas d'utilisation courants</h3>
        <div class="types-grid">
          <div class="type-card">
            <h4>joinFields</h4>
            <p>
              Combine plusieurs champs en une seule chaîne, avec un séparateur
              spécifié. Idéal pour créer des identifiants composites ou des
              labels.
            </p>
            <app-doc-section
              type="data"
              [code]="data.joinFields.code"
            ></app-doc-section>
          </div>
          <div class="type-card">
            <h4>combineFields</h4>
            <p>
              Version plus flexible permettant d'appliquer une fonction
              personnalisée pour combiner les valeurs de plusieurs champs.
            </p>
            <app-doc-section
              type="data"
              [code]="data.combineFields.code"
            ></app-doc-section>
          </div>
        </div>
      </div>

      <app-informations
        title="Applications avancées"
        [notes]="combineNotes"
        type="tip"
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

      h3,
      h4 {
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
    `,
  ],
})
export class DataCombineComponent {
  data: any;
  combineNotes: string[] = [
    '• Utilisez <code>joinFields()</code> pour combiner des valeurs catégorielles ou textuelles',
    '• Préférez <code>combineFields()</code> avec une fonction personnalisée pour des calculs numériques',
    "• Consultez les exemples de graphiques combo et treemap pour voir des cas concrets d'utilisation",
  ];

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.combine;
  }
}