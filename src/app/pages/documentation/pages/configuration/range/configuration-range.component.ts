import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-range',
  template: `<section>
    <app-doc-section
      type="config"
      title="Range Charts"
      [code]="config.basic.code"
      description="Les graphiques de type Range permettent de visualiser des plages de valeurs, comme des minimum/maximum
        ou des intervalles de confiance. Ils sont idéaux pour représenter des variations, des marges d'erreur
        ou des données avec des limites supérieures et inférieures."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>Structure de données</h4>
          <p>Format pour plages de valeurs</p>
          <div class="property-signature">data.x: propriété pour les catégories</div>
          <div class="property-signature">data.y: tableau [min, max]</div>
          <div class="property-signature">rangeFields(minField, maxField): helper pour y</div>
        </div>
        
        <div class="property-item">
          <h4>type</h4>
          <p>Variantes disponibles du graphique</p>
          <div class="property-signature">type: 'rangeBar' | 'rangeArea' | 'rangeColumn'</div>
        </div>
        
        <div class="property-item">
          <h4>horizontal</h4>
          <p>Orientation des barres pour rangeBar</p>
          <div class="property-signature">options.plotOptions.bar.horizontal: boolean</div>
        </div>
        
        <div class="property-item">
          <h4>colors</h4>
          <p>Configuration des couleurs de plage</p>
          <div class="property-signature">colors: string[]</div>
          <div class="property-signature">options.fill.opacity: number</div>
        </div>
      </div>
    </div>
    
    <app-informations
      title="Utilisation avancée"
      [notes]="advancedUsage"
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
export class ConfigurationRangeComponent {
  config: any;
  
  advancedUsage: string[] = [
    '• Utilisez rangeFields() de jquery-core pour extraire facilement les paires min/max de vos objets',
    '• Combinez avec continue: true pour des données temporelles consécutives',
    '• Pour des intervalles de confiance, définissez des couleurs semi-transparentes (opacity < 1)'
  ];
  
  bestPractices: string[] = [
    '• Utilisez rangeBar pour comparer plusieurs plages entre catégories',
    '• Préférez rangeArea pour visualiser l\'évolution de plages dans le temps',
    '• Limitez le nombre de séries à 3-4 maximum pour préserver la lisibilité',
    '• Ajoutez des marqueurs aux points importants pour attirer l\'attention'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.range;
  }
}