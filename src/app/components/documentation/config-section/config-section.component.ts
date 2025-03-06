import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-config-section',
  templateUrl: './config-section.component.html',
  styleUrls: ['./config-section.component.scss'],
})
export class ConfigSectionComponent {
  @Input() title: string = '';
  @Input() code: string = '';
  @Input() description?: string;
  @Input() compatibilityNotes?: string[];
  @Input() examples?: { data: any; config: any }[];
  @Input() showButton: boolean = true;

  shouldShowButton(): boolean {
    // Ne pas afficher le bouton si le titre contient "Structure de base" ou "Global"
    return this.showButton && 
           !this.title?.toLowerCase().includes('structure') && 
           !this.title?.toLowerCase().includes('global');
  }

  getChartType(): string {
    if (this.title) {
      return this.title.split(' ')[0].toLowerCase();
    }
    return '';
  }
}
