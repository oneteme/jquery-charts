import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-data-providers',
  template: `
    <section>
      <h2>Utilisation des Data Providers</h2>

      <div class="introduction">
        <p>
          Les Data Providers sont le cœur du système de visualisation de
          jquery-charts. Un DataProvider est simplement une fonction qui prend
          un objet et un index, et renvoie une valeur.
        </p>
        <p>
          Cette abstraction flexible vous permet de définir comment les données
          sont extraites et transformées pour vos graphiques, que ce soit
          depuis des propriétés d'objets, des valeurs statiques ou des calculs
          personnalisés.
        </p>
        <ul>
          <li>Type générique: <code>(o: any, idx: number) => T</code></li>
          <li>Utilisable pour les axes, séries, couleurs et autres propriétés</li>
          <li>Extensible avec des transformations personnalisées</li>
          <li>Composable pour des transformations complexes de données</li>
        </ul>
      </div>

      <div class="doc-section">
        <h3>Principe fondamental</h3>
        <p class="section-intro">
          Un DataProvider extrait ou génère une valeur à partir d'un objet de données.
          Toutes les fonctions comme <code>field()</code>, <code>values()</code>, et 
          <code>joinFields()</code> sont des générateurs de DataProviders.
        </p>

        <app-doc-section
          type="data"
          title="Les différents types de DataProviders"
          description="Aperçu des DataProviders les plus couramment utilisés"
          [code]="data.basic.code"
        ></app-doc-section>
      </div>

      <div class="doc-section">
        <h3>Cas d'utilisation courants</h3>
        <div class="types-grid">
          <div class="type-card">
            <h4>Mapping de données</h4>
            <p>
              Utilisez <code>mapField()</code> pour transformer des valeurs en 
              d'autres valeurs à l'aide d'un objet Map.
            </p>
            <app-doc-section
              type="code"
              [code]="data.mapping.code"
            ></app-doc-section>
          </div>
          <div class="type-card">
            <h4>DataProviders personnalisés</h4>
            <p>
              Créez vos propres fonctions pour des transformations spécifiques 
              à votre cas d'usage.
            </p>
            <app-doc-section
              type="code"
              [code]="data.custom.code"
            ></app-doc-section>
          </div>
        </div>
      </div>

      <app-informations
        title="Bonnes pratiques"
        [notes]="providerNotes"
        type="info"
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
    `,
  ],
})
export class DataProvidersComponent {
  data: any;
  providerNotes: string[] = [
    '• Privilégiez les DataProviders intégrés (field(), values()) pour les cas simples',
    '• Les DataProviders peuvent être utilisés pour la propriété color afin de créer des graphiques avec couleurs dynamiques',
    "• Pour des transformations complexes, combinez plusieurs DataProviders avec combineProviders()"
  ];

  constructor(private docService: DocumentationService) {
    this.data = this.docService.datas.providers;
  }
}