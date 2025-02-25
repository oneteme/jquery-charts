import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-config-section',
  templateUrl: './config-section.component.html',
  styleUrls: ['./config-section.component.scss']
})
export class ConfigSectionComponent {
  @Input() title: string = '';
  @Input() code: string = '';
  @Input() description?: string;

  get shouldShowButton(): boolean {
    return !this.title.toLowerCase().includes('structure de base');
  }

  getChartType(): string {
    const match = this.title.match(/Configuration des (\w+) Charts/);
    return match ? match[1].toLowerCase() : '';
  }
}
