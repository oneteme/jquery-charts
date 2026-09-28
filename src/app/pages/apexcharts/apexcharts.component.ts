import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as ApexChartComponent } from '@oneteme/jquery-apexcharts';
import { APEXCHARTS_EXAMPLES } from 'src/app/data/chart/apexcharts-examples.data';
import type { ChartType } from '@oneteme/jquery-core';
import { ChartExampleSection, APEXCHARTS_SECTIONS } from '../charts/chart-example-sections';
import { ChartExampleNavigationService } from '../charts/chart-example-navigation.service';
import { trackVisibleChartExample } from '../charts/chart-example-tracker';
import { buildChartCode, highlightChartCode } from 'src/app/core/chart-code-snippet.util';
import { StackBlitzService } from 'src/app/core/services/stackblitz.service';

@Component({
  standalone: true,
  imports: [CommonModule, ApexChartComponent],
  selector: 'app-apexcharts',
  templateUrl: './apexcharts.component.html',
  styleUrls: ['./apexcharts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApexChartsPageComponent implements AfterViewInit, OnDestroy {

  readonly examples = APEXCHARTS_EXAMPLES;

  readonly sections = APEXCHARTS_SECTIONS;

  openCodeBlocks: Record<string, boolean> = {};
  activeCodeBlock: string | null = null;

  private stopExampleTracking: (() => void) | null = null;

  constructor(
    private readonly hostElement: ElementRef<HTMLElement>,
    private readonly chartNavigation: ChartExampleNavigationService,
    private readonly stackBlitzService: StackBlitzService,
  ) {}

  ngAfterViewInit(): void {
    this.chartNavigation.reset();
    this.stopExampleTracking = trackVisibleChartExample(
      this.hostElement.nativeElement,
      id => this.chartNavigation.setCurrentExample(id),
    );
  }

  ngOnDestroy(): void {
    this.stopExampleTracking?.();
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
    const example = this.examples[section.exampleKey];
    if (example) this.stackBlitzService.openExample('apexcharts', section, example);
  }

  getHighlightedCode(type: ChartType, exampleKey: string): string {
    const example = (this.examples as any)[exampleKey];
    if (!example) return '';
    return highlightChartCode(buildChartCode(type, example));
  }
}
