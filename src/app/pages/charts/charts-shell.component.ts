import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChartExampleNavigationService } from './chart-example-navigation.service';
import { supportsChartExample } from './chart-example-sections';

interface LibraryTab {
  label: string;
  path: string;
}

@Component({
  selector: 'app-charts-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  templateUrl: './charts-shell.component.html',
  styleUrls: ['./charts-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsShellComponent implements OnInit, OnDestroy {
  readonly libraries: LibraryTab[] = [
    { label: 'Highcharts', path: '/charts/highcharts' },
    { label: 'ECharts',    path: '/charts/echarts' },
    { label: 'ApexCharts', path: '/charts/apexcharts' },
  ];

  private currentExampleId: string | null = null;
  private galleryOverviewActive = false;
  private readonly routerSubscription = new Subscription();

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly chartNavigation: ChartExampleNavigationService,
  ) {}

  ngOnInit(): void {
    this.updateCurrentExampleFromUrl();
    this.routerSubscription.add(
      this.chartNavigation.currentExample$.subscribe(id => {
        if (!this.galleryOverviewActive) return;
        this.currentExampleId = id;
        this.cdr.markForCheck();
      })
    );
    this.routerSubscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) this.updateCurrentExampleFromUrl();
      })
    );
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  libraryRoute(path: string): string[] {
    const exampleId = this.currentExampleId;
    if (this.galleryOverviewActive && path === this.currentLibraryPath()) return [path];
    return exampleId && supportsChartExample(path, exampleId) ? [path, exampleId] : [path];
  }

  private currentLibraryPath(): string | null {
    const segments = this.router.url.split(/[?#]/, 1)[0].split('/').filter(Boolean);
    return segments[0] === 'charts' && segments[1] ? `/charts/${segments[1]}` : null;
  }

  private updateCurrentExampleFromUrl(): void {
    const segments = this.router.url.split(/[?#]/, 1)[0].split('/').filter(Boolean);
    const isChartsRoute = segments[0] === 'charts';
    const nextType = isChartsRoute && segments.length >= 3 ? segments[2] : null;
    this.galleryOverviewActive = isChartsRoute && segments.length === 2;
    this.currentExampleId = nextType;
    if (this.galleryOverviewActive) this.chartNavigation.reset();
    this.cdr.markForCheck();
  }
}
