import { Component, Input } from '@angular/core';

export type InformationType = 'info' | 'warning' | 'tip';

@Component({
  selector: 'app-informations',
  template: `
    <div class="informations" [ngClass]="type">
      <div class="infos-header">
        <img
          [src]="'assets/icons/' + icon + '.svg'"
          [alt]="type"
          class="info-icon"
        />
        <h3>{{ title }}</h3>
      </div>
      <ul>
        <li *ngFor="let note of notes">{{ note }}</li>
      </ul>
    </div>
  `,
  styleUrls: ['./informations.component.scss'],
})
export class InformationsComponent {
  @Input() title: string = 'Notes importantes';
  @Input() notes: string[] = [];
  @Input() type: InformationType = 'info';

  get icon(): string {
    const icons = {
      info: 'info',
      warning: 'warning',
      tip: 'tip',
    };
    return icons[this.type] || 'info';
  }
}
