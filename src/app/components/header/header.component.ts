import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ChartTypesService } from 'src/app/core/services/chart-types.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="header">
      <nav class="nav">
        <div class="header-left" (click)="goHome()">
          <img src="assets/logo/app-logo.webp" alt="Logo" class="logo" />
          <h1>Jquery-Charts</h1>
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
          <button class="doc-btn" (click)="goToDoc()">
            <span>Documentation</span>
          </button>
          <div class="install-dropdown">
            <button class="download-btn" (click)="toggleInstallMenu()">
              <span>Installer</span>
              <span class="version">v0.0.X</span>
            </button>
            <div class="dropdown-menu" *ngIf="showInstallMenu">
              <button class="dropdown-item" (click)="goToInstall('apexcharts')">
                <span class="library-name">jquery-apexcharts</span>
              </button>
              <button class="dropdown-item" (click)="goToInstall('highcharts')">
                <span class="library-name">jquery-highcharts</span>
              </button>
              <button class="dropdown-item" (click)="goToInstall('echarts')">
                <span class="library-name">jquery-echarts</span>
              </button>
            </div>
          </div>
          <div class="separator"></div>
          <button class="github-btn" (click)="goToGithub()">
            <img src="assets/icons/github.svg" alt="GitHub" />
          </button>
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

  goToDoc() {
    this.router.navigate(['/documentation']);
  }

  toggleInstallMenu() {
    this.showInstallMenu = !this.showInstallMenu;
  }

  openSearch() {
    this.searchOpen.emit();
  }

  goToInstall(library: 'apexcharts' | 'highcharts' | 'echarts') {
    const urls: Record<string, string> = {
      apexcharts: 'https://www.npmjs.com/package/@oneteme/jquery-apexcharts',
      highcharts:  'https://www.npmjs.com/package/@oneteme/jquery-highcharts',
      echarts:     'https://www.npmjs.com/package/@oneteme/jquery-echarts',
    };
    window.open(urls[library], '_blank');
    this.showInstallMenu = false;
  }

  goToGithub() {
    window.open('https://github.com/oneteme/jquery-charts', '_blank');
  }
}
