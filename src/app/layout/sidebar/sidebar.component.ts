import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
export class SidebarComponent implements OnInit {
  @Input() chartTypes: string[] = [];
  @Input() selectedType: string | null = null;
  @Output() selectChartType = new EventEmitter<string>();

  constructor(private router: Router) {}

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSelect(type: string) {
    console.log("8. Selecting chart type:", type);
    this.selectChartType.emit(type);
    if (window.innerWidth <= 768) {
      this.toggleMenu();
    }
  }

  ngOnInit() {
    console.log("5. Sidebar Init - URL:", this.router.url);
    console.log("6. Current selectedType:", this.selectedType);

    if (this.router.url === '/charts' && !this.selectedType) {
      console.log("7. Setting default type to Pie Chart");
      this.selectChartType.emit('Pie Chart');
    }
  }
}
