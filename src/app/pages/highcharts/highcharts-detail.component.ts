import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChartComponent } from '@oneteme/jquery-highcharts';
import { HIGHCHARTS_EXAMPLES } from 'src/app/data/chart/highcharts-examples.data';
import type { ChartType } from '@oneteme/jquery-core';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';
import { StackBlitzService } from 'src/app/core/services/stackblitz.service';
import { Subscription } from 'rxjs';
import { ChartExampleSection, HIGHCHARTS_SECTIONS } from '../charts/chart-example-sections';

const SECTIONS: readonly ChartExampleSection[] = HIGHCHARTS_SECTIONS;

@Component({
  standalone: true,
  imports: [CommonModule, ChartComponent, RouterLink],
  selector: 'app-highcharts-detail',
  template: `
    <div class="hc-page">
      <div class="detail-nav" *ngIf="section">
        <a routerLink="/charts/highcharts" class="back-link">← Tous les types</a>
        <span class="detail-title">{{ section.label }}</span>
        <div class="prev-next">
          <a *ngIf="prev" [routerLink]="['/charts/highcharts', prev.id]" class="nav-btn">‹ {{ prev.label }}</a>
          <a *ngIf="next" [routerLink]="['/charts/highcharts', next.id]" class="nav-btn">{{ next.label }} ›</a>
        </div>
      </div>
      <div class="charts-grid single-card" *ngIf="section">
        <div class="chart-wrapper">
          <div class="chart-label">{{ section!.label }}</div>
          <chart
            class="chart-component"
            [type]="section!.type"
            [config]="currentConfig"
            [data]="currentData"
          ></chart>
          <button class="stackblitz-toggle" (click)="openInStackBlitz($event)" aria-label="Modifier cet exemple dans StackBlitz" title="Modifier dans StackBlitz">
            <span aria-hidden="true">↗</span>
            <span class="tooltip">Modifier dans StackBlitz</span>
          </button>
          <button class="code-toggle" (click)="toggleCode()" aria-label="Voir le code">
            <img src="assets/icons/code.svg" class="code-icon" alt="code" />
            <span class="tooltip">Voir le code</span>
          </button>
          <div class="code-block" [class.open]="isCodeOpen">
            <pre><code [innerHTML]="highlightedCode"></code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./highcharts-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighchartsDetailComponent implements OnInit, OnDestroy {
  section: ChartExampleSection | null = null;
  prev: ChartExampleSection | null = null;
  next: ChartExampleSection | null = null;
  currentConfig: any = null;
  currentData: any = null;
  isCodeOpen = false;
  highlightedCode = '';

  private paramSub: Subscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly stackBlitzService: StackBlitzService,
  ) {}

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      const idx = SECTIONS.findIndex(s => s.id === type);
      if (idx === -1) { this.router.navigate(['/charts/highcharts']); return; }
      this.section       = SECTIONS[idx];
      this.prev          = idx > 0 ? SECTIONS[idx - 1] : null;
      this.next          = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
      const example      = (HIGHCHARTS_EXAMPLES as any)[this.section.exampleKey];
      this.currentConfig = example?.config;
      this.currentData   = example?.data;
      this.isCodeOpen    = false;
      this.highlightedCode = this._buildCode(this.section.type, this.section.exampleKey);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() { this.paramSub?.unsubscribe(); }

  toggleCode() { this.isCodeOpen = !this.isCodeOpen; this.cdr.markForCheck(); }

  openInStackBlitz(event: Event): void {
    event.stopPropagation();
    if (!this.section) return;
    this.stackBlitzService.openExample('highcharts', this.section, {
      config: this.currentConfig,
      data: this.currentData ?? [],
    });
  }

  private _buildCode(type: ChartType, exampleKey: string): string {
    const example = (HIGHCHARTS_EXAMPLES as any)[exampleKey];
    if (!example) return '';
    return highlightChartCode(buildChartCode(type, example));
  }
}
