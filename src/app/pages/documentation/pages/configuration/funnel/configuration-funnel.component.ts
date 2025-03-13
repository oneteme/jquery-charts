import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-funnel',
  template: `<section>
    <app-doc-section
      type="config"
      title="Funnel Charts"
      [code]="config.basic.code"
      description="Les graphiques en entonnoir (funnel) visualisent les étapes d'un processus et l'évolution des valeurs à travers ces étapes.
        Ils sont parfaits pour représenter des processus de conversion, des ventes progressives ou tout flux où 
        les quantités diminuent à chaque étape."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>Structure de données</h4>
          <p>Données pour processus séquentiels</p>
          <div class="property-signature">data.x: propriété pour les étapes/labels</div>
          <div class="property-signature">data.y: propriété pour les valeurs</div>
        </div>
        
        <div class="property-item">
          <h4>type</h4>
          <p>Orientation de l'entonnoir</p>
          <div class="property-signature">type: 'funnel' | 'pyramid'</div>
        </div>
        
        <div class="property-item">
          <h4>dataLabels</h4>
          <p>Position et format des étiquettes</p>
          <div class="property-signature">options.dataLabels.position: 'inside' | 'outside'</div>
          <div class="property-signature">options.dataLabels.formatter: Function</div>
        </div>
        
        <div class="property-item">
          <h4>neckHeight et neckWidth</h4>
          <p>Configuration du goulot (funnel uniquement)</p>
          <div class="property-signature">options.plotOptions.funnel.neckHeight: string</div>
          <div class="property-signature">options.plotOptions.funnel.neckWidth: string</div>
        </div>
      </div>
    </div>
    
    <app-informations
      title="Fonctionnalités spéciales"
      [notes]="specialFeatures"
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
export class ConfigurationFunnelComponent {
  config: any;
  
  specialFeatures: string[] = [
    '• Le type pyramid inverse la direction de l\'entonnoir (plus large en bas)',
    '• Les valeurs peuvent être affichées en valeur absolue ou en pourcentage',
    '• Personnalisez le goulot avec neckHeight/neckWidth pour mettre l\'accent sur certaines étapes'
  ];
  
  bestPractices: string[] = [
    '• Limitez le nombre d\'étapes à 5-7 maximum pour préserver la lisibilité',
    '• Ordonnez les étapes de manière logique (généralement de la plus grande à la plus petite valeur)',
    '• Utilisez des couleurs qui aident à suivre la progression dans le processus',
    '• Ajoutez un formatter pour afficher à la fois les valeurs et les pourcentages'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.funnel;
  }
}