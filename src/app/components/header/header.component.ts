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
            <span class="version">v1.0.0</span>
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
    private router: Router,
    private chartTypesService: ChartTypesService
  ) {}

  goHome() {
    this.chartTypesService.resetSelectedType();
    this.router.navigate(['/home']);
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
}
