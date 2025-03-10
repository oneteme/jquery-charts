import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-fields',
  template: `
    <section>
      <h2>Manipulation des données avec Fields</h2>

      <div class="introduction">
        <p>
          La fonction <code>field()</code> est l'un des outils les plus
          importants de jquery-charts. Elle permet d'accéder dynamiquement aux
          propriétés de vos objets de données et de créer des mappings flexibles
          pour vos visualisations.
        </p>
        <p>
          Cette approche déclarative permet de définir comment les données sont
          transformées en éléments visuels sans avoir à écrire de code impératif
          complexe.
        </p>
        <ul>
          <li>Accès simple aux propriétés des objets de données</li>
          <li>Compatible avec les structures de données imbriquées</li>
          <li>Utilisable pour les valeurs d'axes X/Y et les noms de séries</li>
          <li>
            Combinable avec d'autres fonctions comme <code>values()</code> et
            <code>joinFields()</code>
          </li>
        </ul>
      </div>

      <div class="doc-section">
        <h3>Syntaxe de base et exemples</h3>
        <p class="section-intro">
          La fonction <code>field()</code> prend en paramètre le nom de la
          propriété à récupérer dans l'objet de données.
        </p>

        <app-doc-section type="data" [code]="data.basic.code"></app-doc-section>
      </div>

      <div class="doc-section">
        <h3>Utilisation avancée</h3>
        <div class="types-grid">
          <div class="type-card">
            <h4>Noms de séries dynamiques</h4>
            <p>
              Utilisez <code>field()</code> comme valeur pour la propriété
              <code>name</code>
              d'une série pour générer des noms dynamiques à partir de vos
              données.
            </p>
            <app-doc-section
              type="data"
              [code]="data.dynamicSeries.code"
            ></app-doc-section>
          </div>
          <div class="type-card">
            <h4>Propriétés imbriquées</h4>
            <p>
              Pour les structures de données plus complexes, combinez
              <code>field()</code> avec d'autres fonctions comme
              <code>joinFields()</code>.
            </p>
            <app-doc-section
              type="data"
              [code]="data.nestedProps.code"
            ></app-doc-section>
          </div>
        </div>
      </div>

      <app-informations
        title="Conseils d'utilisation"
        [notes]="fieldNotes"
        type="info"
      >
      </app-informations>
    </section>
  `,
  styles: [
    `
      section {
        max-width: 100%;
      }

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
        max-width: 100%;
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
        max-width: 100%;
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
export class DataFieldsComponent {
  data: any;
  fieldNotes: string[] = [
    '• Assurez-vous que la propriété référencée existe dans vos données pour éviter les erreurs',
    '• Pour les structures de données complexes, utilisez mapField() ou des techniques plus avancées',
    "• Consultez les exemples spécifiques dans la section /charts pour voir des cas d'utilisation concrets",
  ];

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.fields;
  }
}
