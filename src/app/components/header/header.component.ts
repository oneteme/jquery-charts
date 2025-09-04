import { Component, EventEmitter, Output } from '@angular/core';
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
          <button class="doc-btn" (click)="goToDoc()">
            <span>Documentation</span>
          </button>
          <button class="download-btn" (click)="goToInstall()">
            <span>Installer</span>
            <span class="version">v0.0.18</span>
          </button>
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

  constructor(
    private readonly router: Router,
    private readonly chartTypesService: ChartTypesService
  ) {}

  goHome() {
    this.chartTypesService.resetSelectedType();
    this.router.navigate(['/']);
  }

  goToDoc() {
    this.router.navigate(['/documentation']);
  }

  goToInstall() {
    window.open(
      'https://www.npmjs.com/package/@oneteme/jquery-apexcharts',
      '_blank'
    );
  }

  goToGithub() {
    window.open('https://github.com/oneteme/jquery-charts', '_blank');
  }
}
