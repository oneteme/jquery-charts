import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  template: `
    <div class="sidebar">
      <ul>
        <li *ngFor="let type of chartTypes" 
            [class.active]="selectedType === type"
            (click)="onSelect(type)">
          {{type}}
        </li>
      </ul>
    </div>
  `,
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() chartTypes: string[] = [];
  @Output() selectChartType = new EventEmitter<string>();
  
  selectedType: string = '';

  onSelect(type: string) {
    this.selectedType = type;
    this.selectChartType.emit(type);
  }

  // write calcul function
  
}
