import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  template: `
    <button class="menu-toggle" (click)="toggleMenu()" [class.active]="isMenuOpen">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div class="sidebar" [class.open]="isMenuOpen">
      <ul>
        <li *ngFor="let type of chartTypes" 
            [class.active]="selectedType === type"
            (click)="onSelect(type)">
          {{type}}
        </li>
      </ul>
    </div>

    <div class="overlay" 
         *ngIf="isMenuOpen" 
         (click)="toggleMenu()">
    </div>
  `,
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() chartTypes: string[] = [];
  @Output() selectChartType = new EventEmitter<string>();
  
  selectedType: string = '';
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSelect(type: string) {
    this.selectedType = type;
    this.selectChartType.emit(type);
    if (window.innerWidth <= 768) {
      this.toggleMenu();
    }
  }
}