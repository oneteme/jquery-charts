import { Component, Input, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ChartTypesService } from 'src/app/core/services/chart-types.service';

@Component({
  selector: 'app-sidebar',
  template: `
    <button
      class="menu-toggle"
      (click)="toggleMenu()"
      [class.active]="isMenuOpen"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div class="sidebar" [class.open]="isMenuOpen">
      <ul>
        <li
          *ngFor="let type of chartTypes; trackBy: trackByFn"
          [class.active]="selectedType === type"
          (click)="onSelect(type)"
        >
          {{ type }}
        </li>
      </ul>
    </div>

    <div class="overlay" *ngIf="isMenuOpen" (click)="toggleMenu()"></div>
  `,
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  @Input() chartTypes: string[] = [];
  @Input() selectedType: string | null = null;
  isMenuOpen = false;

  constructor(
    private readonly router: Router,
    private readonly chartTypesService: ChartTypesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chartTypes = this.chartTypesService.getChartTypes();
    this.chartTypesService.getSelectedType().subscribe((type) => {
      if (this.router.url.startsWith('/charts')) {
        Promise.resolve().then(() => {
          this.selectedType = type;
          this.cdr.markForCheck();
        });
      } else {
        this.selectedType = null;
      }
    });
  }

  trackByFn(index: number, item: string): string {
    return item;
  }

  onSelect(type: string) {
    this.selectedType = type;
    this.chartTypesService.setSelectedType(type);
    const urlType = type
      .toLowerCase()
      .replace(' chart', '')
      .replace(/\s+/g, '-');
    this.router.navigate(['/charts', urlType]);
    if (this.isMenuOpen) {
      this.toggleMenu();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.markForCheck();
  }
}
