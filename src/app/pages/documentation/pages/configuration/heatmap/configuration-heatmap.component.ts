import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-heatmap',
  template: `<section>
    <app-doc-section
      type="config"
      title="Heatmap Charts"
      [code]="config.basic.code"
      description="Les heatmaps (cartes de chaleur) permettent de visualiser l'intensité des données dans une matrice à deux dimensions.
        Elles sont particulièrement utiles pour identifier des modèles, des corrélations ou des anomalies 
        dans des ensembles de données complexes grâce à l'utilisation de couleurs."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>Structure de données</h4>
          <p>Mapping pour matrice X/Y</p>
          <div class="property-signature">data.x: propriété pour les colonnes</div>
          <div class="property-signature">data.y: propriété pour les lignes</div>
          <div class="property-signature">data.z: propriété pour les valeurs (intensité)</div>
        </div>
        
        <div class="property-item">
          <h4>colorScale</h4>
          <p>Configuration de l'échelle de couleurs</p>
          <div class="property-signature">options.plotOptions.heatmap.colorScale.ranges: Array</div>
          <div class="property-signature">options.plotOptions.heatmap.colorScale.min: number</div>
          <div class="property-signature">options.plotOptions.heatmap.colorScale.max: number</div>
        </div>
        
        <div class="property-item">
          <h4>dataLabels</h4>
          <p>Affichage des valeurs dans les cellules</p>
          <div class="property-signature">options.dataLabels.enabled: boolean</div>
          <div class="property-signature">options.dataLabels.formatter: Function</div>
        </div>
        
        <div class="property-item">
          <h4>shadeIntensity</h4>
          <p>Contrôle l'intensité de la couleur</p>
          <div class="property-signature">options.plotOptions.heatmap.shadeIntensity: number</div>
        </div>
      </div>
    </div>
    
    <app-informations
      title="Techniques avancées"
      [notes]="advancedTips"
      type="info"
    >
    </app-informations>
    
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
export class ConfigurationHeatmapComponent {
  config: any;
  
  advancedTips: string[] = [
    '• Utilisez field() pour les propriétés x et y, et combineProviders() pour créer des valeurs z complexes',
    '• Les échelles de couleurs peuvent être personnalisées pour des seuils spécifiques via colorScale.ranges',
    '• Pivotez vos données avec pivot: true pour inverser les axes X et Y de la heatmap'
  ];
  
  bestPractices: string[] = [
    '• Choisissez des palettes de couleurs intuitives (ex: rouge pour les valeurs élevées, bleu pour les faibles)',
    '• Limitez le nombre de cellules pour préserver la lisibilité (50-100 maximum)',
    '• Ajoutez des dataLabels pour les valeurs importantes, mais désactivez-les si la matrice est dense',
    '• Utilisez des échelles logarithmiques pour les données avec de grands écarts de valeurs'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.heatmap;
  }
}