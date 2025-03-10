import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-treemap',
  template: `<section>
    <app-doc-section
      type="config"
      title="Treemap Charts"
      [code]="config.basic.code"
      description="Les graphiques treemap permettent de visualiser des données hiérarchiques en utilisant des rectangles imbriqués.
        La taille de chaque rectangle représente une valeur quantitative, tandis que le groupement et
        la coloration permettent d'ajouter des dimensions supplémentaires à la visualisation."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>Structure de données</h4>
          <p>Mapping avec groupement hiérarchique</p>
          <div class="property-signature">data.x: propriété pour les labels</div>
          <div class="property-signature">data.y: propriété pour les valeurs (taille)</div>
          <div class="property-signature">data.z: propriété pour le groupement (optionnel)</div>
        </div>
        
        <div class="property-item">
          <h4>distributed</h4>
          <p>Distribution uniforme des couleurs</p>
          <div class="property-signature">options.plotOptions.treemap.distributed: boolean</div>
        </div>
        
        <div class="property-item">
          <h4>enableShades</h4>
          <p>Nuances de couleurs selon la hiérarchie</p>
          <div class="property-signature">options.plotOptions.treemap.enableShades: boolean</div>
        </div>
        
        <div class="property-item">
          <h4>dataLabels</h4>
          <p>Configuration des étiquettes</p>
          <div class="property-signature">options.dataLabels.enabled: boolean</div>
          <div class="property-signature">options.dataLabels.format: string</div>
        </div>
      </div>
    </div>
    
    <app-informations
      title="Fonctionnalités avancées"
      [notes]="advancedFeatures"
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
export class ConfigurationTreemapComponent {
  config: any;
  
  advancedFeatures: string[] = [
    '• La propriété z permet de créer des groupements hiérarchiques au sein du treemap',
    '• Le formatage des étiquettes permet d\'afficher à la fois des valeurs et des pourcentages',
    '• Utilisez la fonction joinFields() de jquery-core pour combiner plusieurs champs comme étiquettes'
  ];
  
  bestPractices: string[] = [
    '• Utilisez distributed: true pour distinguer clairement les différentes catégories',
    '• Activez enableShades pour les données avec plusieurs niveaux hiérarchiques',
    '• Formatez les dataLabels pour inclure à la fois le nom et la valeur',
    '• Limitez la profondeur hiérarchique à 2-3 niveaux maximum pour la lisibilité'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.treemap;
  }
}