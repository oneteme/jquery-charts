import { Component } from '@angular/core';
import { DocumentationService } from '../../../../../core/services/documentation.service';

@Component({
  selector: 'app-configuration-line',
  template: `<section>
    <app-doc-section
      type="config"
      title="Line Charts"
      [code]="config.basic.code"
      description="Les graphiques linéaires sont particulièrement adaptés pour visualiser des tendances et évolutions temporelles.
        jquery-charts offre plusieurs variantes comme le line simple ou l'area (avec remplissage),
        ainsi que différents styles de courbes pour mieux représenter vos données."
      [compatibilityNotes]=""
    >
    </app-doc-section>
    
    <div class="config-details">
      <h3>Propriétés spécifiques</h3>
      <div class="properties-grid">
        <div class="property-item">
          <h4>type</h4>
          <p>Type de ligne (simple ou avec remplissage)</p>
          <div class="property-signature">type: 'line' | 'area'</div>
        </div>
        
        <div class="property-item">
          <h4>curve</h4>
          <p>Style de la courbe entre les points</p>
          <div class="property-signature">curve: 'smooth' | 'straight' | 'stepline'</div>
        </div>
        
        <div class="property-item">
          <h4>markers</h4>
          <p>Configuration des points sur la ligne</p>
          <div class="property-signature">options.markers.size: number</div>
          <div class="property-signature">options.markers.shape: 'circle' | 'square'</div>
        </div>
        
        <div class="property-item">
          <h4>stroke</h4>
          <p>Style de la ligne elle-même</p>
          <div class="property-signature">options.stroke.width: number</div>
        </div>
        
        <div class="property-item">
          <h4>fill (pour area)</h4>
          <p>Configuration de la zone de remplissage</p>
          <div class="property-signature">options.fill.opacity: number</div>
        </div>
        
        <div class="property-item">
          <h4>continue</h4>
          <p>Pour les données séquentielles</p>
          <div class="property-signature">continue: boolean</div>
        </div>
      </div>
    </div>
    
    <app-informations
      title="Compatibilités et restrictions"
      [notes]="restrictions"
      type="warning"
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
export class ConfigurationLineComponent {
  config: any;
  
  restrictions: string[] = [
    '• Le type "area" est incompatible avec curve: "stepline"',
    '• Pour les données temporelles, assurez-vous que les valeurs sont bien triées',
    '• Ne pas dépasser 5-6 séries sur un même graphique pour préserver la lisibilité'
  ];
  
  bestPractices: string[] = [
    '• Utilisez le mode "continue: true" avec des données temporelles ordonnées',
    '• Le type "area" est recommandé pour visualiser les volumes ou les accumulations',
    '• Préférez "smooth" pour les tendances générales et "straight" pour les données précises',
    '• Pour comparer des séries avec de grandes différences d\'amplitude, envisagez un axe Y secondaire'
  ];

  constructor(private docService: DocumentationService) {
    this.config = this.docService.configs.line;
  }
}