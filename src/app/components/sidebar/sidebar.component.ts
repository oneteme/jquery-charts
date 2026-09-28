import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { APEXCHARTS_SECTIONS, ECHARTS_DETAIL_SECTIONS, HIGHCHARTS_SECTIONS } from 'src/app/pages/charts/chart-example-sections';

interface ChartTypeItem { id: string; label: string; }
interface LibItem { key: string; label: string; route: string; types: ChartTypeItem[]; }

@Component({
  selector: 'app-sidebar',
  template: `
    <button class="menu-toggle" (click)="toggleMenu()" [class.active]="isMenuOpen" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>

    <div class="sidebar" [class.open]="isMenuOpen">

      <div class="sidebar-section sidebar-section--start">
        <ul>
          <li [class.active]="isDocumentationRoute()">
            <button type="button" class="sidebar-link" (click)="goToDocumentation()">Démarrer</button>
          </li>
        </ul>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">Composants</span>
        <ul>
          <li [class.active]="isTableRoute()">
            <button type="button" class="sidebar-link" (click)="goToTable()">jquery-table</button>
          </li>
          <li [class.active]="isOrganizerRoute()">
            <button type="button" class="sidebar-link" (click)="goToOrganizer()">jquery-organizer</button>
          </li>
        </ul>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">Graphiques</span>
        <ul>
          <li *ngFor="let lib of libs" [class.active]="isChartsLib(lib.key)">
            <button type="button" class="lib-name" (click)="goToLib(lib)">{{ lib.label }}</button>
            <button
              type="button"
              class="lib-arrow"
              [class.open]="isExpanded(lib.key)"
              [attr.aria-label]="(isExpanded(lib.key) ? 'Replier' : 'Déplier') + ' les exemples ' + lib.label"
              [attr.aria-expanded]="isExpanded(lib.key)"
              (click)="toggleExpand(lib, $event)"
            >›</button>
            <ul class="sub-list" *ngIf="isExpanded(lib.key)">
              <li
                *ngFor="let type of lib.types; trackBy: trackByFn"
                [class.active]="isActiveType(lib, type)"
              >
                <button type="button" class="sidebar-link" (click)="goToType(lib, type)">{{ type.label }}</button>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <div class="sidebar-section">
        <span class="sidebar-section-label">API</span>
        <ul>
          <li [class.active]="isCoreApiRoute()"><button type="button" class="sidebar-link" (click)="goToCoreApi()">jquery-core</button></li>
          <li [class.active]="isOrganizerApiRoute()"><button type="button" class="sidebar-link" (click)="goToOrganizerApi()">jquery-organizer</button></li>
          <li [class.active]="isHighchartsApiRoute()"><button type="button" class="sidebar-link" (click)="goToHighchartsApi()">jquery-highcharts</button></li>
          <li [class.active]="isApiRoute()"><button type="button" class="sidebar-link" (click)="goToApi()">jquery-echarts</button></li>
          <li [class.active]="isApexchartsApiRoute()"><button type="button" class="sidebar-link" (click)="goToApexchartsApi()">jquery-apexcharts</button></li>
          <li [class.active]="isTableApiRoute()"><button type="button" class="sidebar-link" (click)="goToTableApi()">jquery-table</button></li>
        </ul>
      </div>

    </div>

    <div class="overlay" *ngIf="isMenuOpen" (click)="toggleMenu()"></div>
  `,
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  isMenuOpen = false;
  expandedLibs = new Set<string>();

  readonly libs: LibItem[] = [
    {
      key: 'highcharts', label: 'jquery-highcharts', route: '/charts/highcharts',
      types: HIGHCHARTS_SECTIONS.map(({ id, label }) => ({ id, label }))
    },
    {
      key: 'echarts', label: 'jquery-echarts', route: '/charts/echarts',
      types: ECHARTS_DETAIL_SECTIONS.map(({ id, label }) => ({ id, label }))
    },
    {
      key: 'apexcharts', label: 'jquery-apexcharts', route: '/charts/apexcharts',
      types: APEXCHARTS_SECTIONS.map(({ id, label }) => ({ id, label }))
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.expandActiveLib();

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.expandActiveLib();
      this.cdr.markForCheck();
    });
  }

  private expandActiveLib(): void {
    const activeLib = this.libs.find(lib => this.isChartsLib(lib.key));
    this.expandedLibs.clear();
    if (activeLib) this.expandedLibs.add(activeLib.key);
  }

  trackByFn(_index: number, item: ChartTypeItem): string { return item.id; }

  isTableRoute(): boolean { return this.router.url.startsWith('/table'); }

  isDocumentationRoute(): boolean {
    return this.router.url.startsWith('/demarrer') || this.router.url.startsWith('/prise-en-main') || this.router.url.startsWith('/documentation');
  }

  isCoreApiRoute(): boolean { return this.router.url === '/api/core'; }

  isApiRoute(): boolean { return this.router.url === '/api/echarts'; }

  isHighchartsApiRoute(): boolean { return this.router.url === '/api/highcharts'; }

  isApexchartsApiRoute(): boolean { return this.router.url === '/api/apexcharts'; }

  isTableApiRoute(): boolean { return this.router.url === '/api/table'; }

  isOrganizerRoute(): boolean { return this.router.url === '/organizer'; }

  isOrganizerApiRoute(): boolean { return this.router.url === '/api/organizer'; }

  isChartsLib(key: string): boolean { return this.router.url.startsWith(`/charts/${key}`); }

  isExpanded(key: string): boolean { return this.expandedLibs.has(key); }

  isActiveType(lib: LibItem, type: ChartTypeItem): boolean {
    return this.router.url === `${lib.route}/${type.id}`;
  }

  goToTable() {
    this.router.navigate(['/table']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToDocumentation() {
    this.router.navigate(['/demarrer']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToCoreApi() {
    this.router.navigate(['/api/core']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToApi() {
    this.router.navigate(['/api/echarts']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToHighchartsApi() {
    this.router.navigate(['/api/highcharts']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToApexchartsApi() {
    this.router.navigate(['/api/apexcharts']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToTableApi() {
    this.router.navigate(['/api/table']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToOrganizer() {
    this.router.navigate(['/organizer']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToOrganizerApi() {
    this.router.navigate(['/api/organizer']);
    if (this.isMenuOpen) this.toggleMenu();
  }

  goToLib(lib: LibItem) {
    const wasExpanded = this.expandedLibs.has(lib.key);
    this.expandedLibs.clear();
    if (!wasExpanded) this.expandedLibs.add(lib.key);
    this.cdr.markForCheck();

    this.router.navigate([lib.route]).then(() => {
      if (wasExpanded) {
        this.expandedLibs.delete(lib.key);
        this.cdr.markForCheck();
      }
    });
    if (this.isMenuOpen) this.toggleMenu();
  }

  toggleExpand(lib: LibItem, event: Event) {
    event.stopPropagation();
    if (this.expandedLibs.has(lib.key)) {
      this.expandedLibs.delete(lib.key);
    } else {
      this.expandedLibs.clear();
      this.expandedLibs.add(lib.key);
    }
    this.cdr.markForCheck();
  }

  goToType(lib: LibItem, type: ChartTypeItem) {
    this.router.navigate([lib.route, type.id]);
    if (this.isMenuOpen) this.toggleMenu();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.cdr.markForCheck();
  }
}
