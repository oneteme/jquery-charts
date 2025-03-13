import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-pie',
  template: `<section>
    <app-doc-section
      type="config"
      title="Pie Charts"
      [code]="config.basic.code"
      description="Les graphiques circulaires permettent de visualiser la répartition proportionnelle des données au sein d'un ensemble.
        Avec jquery-charts, vous pouvez créer facilement des visualisations en pie, donut, polaires ou radar
        à partir des mêmes données sous-jacentes."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>type</h4>
          <p>Définit le style de visualisation circulaire</p>
          <div class="property-signature">type: 'pie' | 'donut' | 'polar' | 'radar' | 'radialBar'</div>
        </div>
        
        <div class="property-item">
          <h4>dataLabels</h4>
          <p>Configure les étiquettes de données sur le graphique</p>
          <div class="property-signature">options.dataLabels.enabled: boolean</div>
          <div class="property-signature">options.dataLabels.formatter: (val) => string</div>
        </div>
        
        <div class="property-item">
          <h4>legend</h4>
          <p>Personnalise la légende du graphique</p>
          <div class="property-signature">options.legend.position: 'top' | 'right' | 'bottom' | 'left'</div>
        </div>
        
        <div class="property-item">
          <h4>Structure de données</h4>
          <p>Mapping entre les données et les éléments visuels</p>
          <div class="property-signature">data.x: propriété pour les labels</div>
          <div class="property-signature">data.y: propriété pour les valeurs</div>
        </div>
      </div>
    </div>
    
    <app-informations
      title="Bonnes pratiques"
      [notes]="bestPractices"
      type="tip"
    >
    </app-informations>
  </section>`,
  styles: [`
    .config-details {
      margin: 2rem 0;
    }
    
    .config-details h3 {
      margin-bottom: 1.5rem;
      color: #34495e;
    }
    
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .property-item {
      padding: 1rem;
      background-color: #f8f9fc;
      border-radius: 6px;
      border-left: 4px solid #4aa3a2;
    }
    
    .property-item h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }
    
    .property-item p {
      margin: 0;
      color: #5a6b7b;
    }
    
    .property-signature {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background-color: #f1f1f1;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .properties-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ConfigurationPieComponent {
  config: any;
  bestPractices: string[] = [
    '• Limitez le nombre de segments à 7 maximum pour une meilleure lisibilité',
    '• Utilisez le type "donut" pour inclure des informations complémentaires au centre',
    '• Pour les valeurs très petites, envisagez de les regrouper dans une catégorie "Autres"',
    '• Les couleurs peuvent être définies dynamiquement via un DataProvider pour refléter la nature des données'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.pie;
  }
}