import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-bar',
  template: `<section>
    <app-doc-section
      type="config"
      title="Bar Charts"
      [code]="config.basic.code"
      description="Les graphiques à barres sont parfaits pour comparer des valeurs entre différentes catégories.
        jquery-charts vous permet de créer des barres verticales (column) ou horizontales (bar) avec
        de nombreuses options de personnalisation comme l'empilement (stacked) ou le pivotement des données."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>type</h4>
          <p>Détermine l'orientation des barres</p>
          <div class="property-signature">type: 'bar' | 'column'</div>
        </div>
        
        <div class="property-item">
          <h4>stacked</h4>
          <p>Active l'empilement des séries</p>
          <div class="property-signature">stacked: boolean</div>
          <div class="property-signature">stack: string | (o, i) => string</div>
        </div>
        
        <div class="property-item">
          <h4>horizontal</h4>
          <p>Alternative pour l'orientation des barres</p>
          <div class="property-signature">options.plotOptions.bar.horizontal: boolean</div>
        </div>
        
        <div class="property-item">
          <h4>pivot et continue</h4>
          <p>Options avancées pour la manipulation des données</p>
          <div class="property-signature">pivot: boolean  // Transposes les données</div>
          <div class="property-signature">continue: boolean  // Mode de catégories dynamiques</div>
        </div>
        
        <div class="property-item">
          <h4>xorder</h4>
          <p>Tri des catégories sur l'axe X</p>
          <div class="property-signature">xorder: 'asc' | 'desc'</div>
        </div>
        
        <div class="property-item">
          <h4>borderRadius</h4>
          <p>Arrondi des coins des barres</p>
          <div class="property-signature">options.plotOptions.bar.borderRadius: number</div>
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
export class ConfigurationBarComponent {
  config: any;
  bestPractices: string[] = [
    '• Utilisez le type "bar" (horizontal) pour les étiquettes longues',
    '• Activez stacked pour comparer des totaux et des composants simultanément',
    '• Utilisez des couleurs cohérentes pour les mêmes séries dans différents graphiques',
    '• Le mode pivot est idéal pour inverser la représentation de jeux de données complexes',
    '• Limitez le nombre de séries pour maintenir la lisibilité'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.bar;
  }
}