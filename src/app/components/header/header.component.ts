import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { ChartTypesService } from 'src/app/core/services/chart-types.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="header">
      <nav class="nav">
        <div class="header-main">
          <div class="header-left" (click)="goHome()">
            <img src="assets/logo/app-logo.webp" alt="Logo" class="logo" />
            <h1>Jquery-Charts</h1>
          </div>
          <div class="primary-nav" role="navigation" aria-label="Navigation principale">
            <a
              routerLink="/produit"
              class="primary-nav__link"
              [class.active]="isProductActive()"
              [attr.aria-current]="isProductActive() ? 'page' : null"
            >Produit</a>
            <a
              routerLink="/demarrer"
              class="primary-nav__link"
              [class.active]="isUsageActive()"
              [attr.aria-current]="isUsageActive() ? 'page' : null"
            >Utilisation</a>
          </div>
        </div>
        <div class="header-right">
          <!-- Bouton Recherche rapide (Ctrl+K) -->
          <button class="search-btn" (click)="openSearch()" title="Ctrl+K">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span class="search-btn__label">Rechercher</span>
            <kbd class="search-btn__kbd">Ctrl K</kbd>
          </button>
          <div class="separator"></div>
          <div class="resource-links" role="group" aria-label="Ressources développeur">
            <div class="install-dropdown">
              <button class="download-btn" (click)="toggleInstallMenu()" aria-label="Ouvrir les paquets npm" aria-haspopup="menu" [attr.aria-expanded]="showInstallMenu" title="Ouvrir les paquets npm">
                <img src="assets/icons/npm.svg" alt="npm" class="npm-logo" />
              </button>
              <div class="dropdown-menu" *ngIf="showInstallMenu">
                <button class="dropdown-item" (click)="goToInstall('core')">
                  <span class="library-name">jquery-core</span>
                </button>
                <button class="dropdown-item" (click)="goToInstall('organizer')">
                  <span class="library-name">jquery-organizer</span>
                </button>
                <button class="dropdown-item" (click)="goToInstall('highcharts')">
                  <span class="library-name">jquery-highcharts</span>
                </button>
                <button class="dropdown-item" (click)="goToInstall('echarts')">
                  <span class="library-name">jquery-echarts</span>
                </button>
                <button class="dropdown-item" (click)="goToInstall('apexcharts')">
                  <span class="library-name">jquery-apexcharts</span>
                </button>
                <button class="dropdown-item" (click)="goToInstall('table')">
                  <span class="library-name">jquery-table</span>
                </button>
              </div>
            </div>
            <span class="resource-divider" aria-hidden="true"></span>
            <button class="github-btn" (click)="goToGithub()" aria-label="Ouvrir GitHub" title="Ouvrir GitHub">
              <img src="assets/icons/github.svg" alt="GitHub" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output() goToHome = new EventEmitter<void>();
  @Output() searchOpen = new EventEmitter<void>();
  showInstallMenu = false;

  constructor(
    private readonly router: Router,
    private readonly chartTypesService: ChartTypesService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.install-dropdown') && this.showInstallMenu) {
      this.showInstallMenu = false;
    }
  }

  goHome() {
    this.chartTypesService.resetSelectedType();
    this.router.navigate(['/']);
  }

  isProductActive(): boolean {
    return this.currentPath === '/' || this.currentPath === '/produit';
  }

  isUsageActive(): boolean {
    return !this.isProductActive() && !this.isNotFoundRoute();
  }

  private get currentPath(): string {
    return this.router.url.split(/[?#]/)[0] || '/';
  }

  private isNotFoundRoute(): boolean {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    return route.data['notFound'] === true;
  }

  toggleInstallMenu() {
    this.showInstallMenu = !this.showInstallMenu;
  }

  openSearch() {
    this.searchOpen.emit();
  }

  goToInstall(library: 'core' | 'organizer' | 'highcharts' | 'echarts' | 'apexcharts' | 'table') {
    const urls: Record<string, string> = {
      core:       'https://www.npmjs.com/package/@oneteme/jquery-core',
      organizer:  'https://www.npmjs.com/package/@oneteme/jquery-organizer',
      highcharts:  'https://www.npmjs.com/package/@oneteme/jquery-highcharts',
      echarts:     'https://www.npmjs.com/package/@oneteme/jquery-echarts',
      apexcharts: 'https://www.npmjs.com/package/@oneteme/jquery-apexcharts',
      table:      'https://www.npmjs.com/package/@oneteme/jquery-table',
    };
    window.open(urls[library], '_blank', 'noopener,noreferrer');
    this.showInstallMenu = false;
  }

  goToGithub() {
    window.open('https://github.com/oneteme/jquery-charts', '_blank', 'noopener,noreferrer');
  }
}
