import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { ChartComponent } from '@oneteme/jquery-highcharts';
import { HIGHCHARTS_EXAMPLES } from 'src/app/data/chart/highcharts-examples.data';
import type { ChartType } from '@oneteme/jquery-core';
import { ChartExampleSection, HIGHCHARTS_SECTIONS } from '../charts/chart-example-sections';
import { ChartExampleNavigationService } from '../charts/chart-example-navigation.service';
import { trackVisibleChartExample } from '../charts/chart-example-tracker';
import { DeferredChartRendering, trackDeferredChartRendering } from '../charts/chart-deferred-rendering';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';
import { StackBlitzService } from 'src/app/core/services/stackblitz.service';

@Component({
  standalone: true,
  imports: [CommonModule, ChartComponent],
  selector: 'app-highcharts-gallery',
  templateUrl: './highcharts-gallery.component.html',
  styleUrls: ['./highcharts-gallery.component.scss'],
})
export class HighchartsGalleryComponent implements AfterViewInit, OnDestroy {

  readonly examples = HIGHCHARTS_EXAMPLES;

  readonly sections = HIGHCHARTS_SECTIONS;

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

  private stopExampleTracking: (() => void) | null = null;
  private chartRendering: DeferredChartRendering | null = null;

  constructor(
    private readonly hostElement: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
    private readonly chartNavigation: ChartExampleNavigationService,
    private readonly stackBlitzService: StackBlitzService,
  ) {}

  ngAfterViewInit(): void {
    this.chartNavigation.reset();
    this.stopExampleTracking = trackVisibleChartExample(
      this.hostElement.nativeElement,
      id => this.chartNavigation.setCurrentExample(id),
    );
    this.chartRendering = trackDeferredChartRendering(
      this.hostElement.nativeElement,
      () => this.cdr.detectChanges(),
    );
  }

  ngOnDestroy(): void {
    this.stopExampleTracking?.();
    this.chartRendering?.stop();
  }

  isChartRendered(id: string): boolean {
    return this.chartRendering?.isRendered(id) ?? false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.code-block') && !target.closest('.code-toggle')) {
      this.openCodeBlocks = {};
      this.activeCodeBlock = null;
    }
  }

  toggleCode(id: string, event: Event): void {
    event.stopPropagation();
    if (this.activeCodeBlock && this.activeCodeBlock !== id) {
      this.openCodeBlocks[this.activeCodeBlock] = false;
    }
    this.openCodeBlocks[id] = !this.openCodeBlocks[id];
    this.activeCodeBlock = this.openCodeBlocks[id] ? id : null;
  }

  isCodeOpen(id: string): boolean {
    return this.openCodeBlocks[id] ?? false;
  }

  openInStackBlitz(section: ChartExampleSection, event: Event): void {
    event.stopPropagation();

    const example = (this.examples as Record<string, { config: unknown; data: unknown[] }>)[section.exampleKey];
    if (example) this.stackBlitzService.openExample('highcharts', section, example);
  }

  getHighlightedCode(type: ChartType, exampleKey: string): string {
    const example = (this.examples as any)[exampleKey];
    if (!example) return '';
    return highlightChartCode(buildChartCode(type, example));
  }
}
