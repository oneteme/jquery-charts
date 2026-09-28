import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ChartProvider, ChartType, field } from '@oneteme/jquery-core';
import { ChartComponent as EChartsPreviewComponent } from '@oneteme/jquery-echarts';
import {
  OrganizerButtonComponent,
  OrganizerButtonEvent,
  OrganizerConfig as OrganizerMenuConfig,
  OrganizerState as OrganizerMenuState,
} from '@oneteme/jquery-organizer';
import { ApexChartPreviewComponent } from './apexcharts-chart-test/apexcharts-chart-test.component';
import { HighchartsChartPreviewComponent } from './highcharts-test/highcharts-test.component';
import { mapChartConfig, mapChartData } from './highcharts-test/map-test-data';
import {
  APEXCHARTS_SECTIONS,
  ChartExampleSection,
  ECHARTS_DETAIL_SECTIONS,
  HIGHCHARTS_SECTIONS,
} from '../charts/chart-example-sections';

type ChartLibrary = 'echarts' | 'highcharts' | 'apexcharts';
type DataMode = 'compact' | 'series';

interface LibraryOption {
  id: ChartLibrary;
  label: string;
  packageName: string;
  sections: readonly ChartExampleSection[];
}

@Component({
  selector: 'app-chart-workbench',
  templateUrl: './basic-test.component.html',
  styleUrls: ['./basic-test.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    EChartsPreviewComponent,
    OrganizerButtonComponent,
    ApexChartPreviewComponent,
    HighchartsChartPreviewComponent,
  ],
})
export class ChartWorkbenchComponent implements OnDestroy, OnInit {
  readonly libraries: readonly LibraryOption[] = [
    {
      id: 'echarts',
      label: 'ECharts',
      packageName: '@oneteme/jquery-echarts',
      sections: ECHARTS_DETAIL_SECTIONS,
    },
    {
      id: 'highcharts',
      label: 'Highcharts',
      packageName: '@oneteme/jquery-highcharts',
      sections: HIGHCHARTS_SECTIONS,
    },
    {
      id: 'apexcharts',
      label: 'ApexCharts',
      packageName: '@oneteme/jquery-apexcharts',
      sections: APEXCHARTS_SECTIONS,
    },
  ];

  private readonly workbenchTypeIds = new Set([
    'line',
    'area',
    'bar',
    'column',
    'pie',
    'donut',
    'scatter',
    'bubble',
    'funnel',
    'radar',
    'heatmap',
    'treemap',
  ]);

  chartType: ChartType = 'line';
  chartData: any[] = [];
  isLoadingData = false;
  chartLibrary: ChartLibrary = 'echarts';
  dataMode: DataMode = 'series';

  organizerMenuConfig: OrganizerMenuConfig = {
    fields: [
      { id: 'Ventes', label: 'Ventes', visible: true },
      { id: 'Objectif', label: 'Objectif', visible: true },
    ],
    chartTypes: [],
    buttonLabel: 'Organiser',
    buttonIcon: 'tune',
    showButtonIcon: true,
  };
  organizerMenuState: OrganizerMenuState = {
    visibleFields: ['Ventes', 'Objectif'],
    selectedChartType: this.chartType,
  };

  private readonly compactConfig: ChartProvider<string, number> = {
    title: 'Répartition par équipe',
    subtitle: 'Même configuration, données courtes',
    series: [
      { name: 'Ventes', color: '#0f766e', data: { x: field('team'), y: field('value') } },
      { name: 'Objectif', color: '#d97732', data: { x: field('team'), y: field('target') } },
    ],
    showToolbar: true,
  };

  private readonly seriesConfig: ChartProvider<string, number> = {
    title: 'Performance par équipe',
    subtitle: 'Deux séries, un contrat commun',
    xtitle: 'Mois',
    ytitle: 'Valeur',
    stacked: false,
    series: [
      { name: 'Ventes', color: '#0f766e', data: { x: field('month'), y: field('value') } },
      { name: 'Objectif', color: '#d97732', data: { x: field('month'), y: field('target') } },
    ],
    showToolbar: true,
  };

  chartConfig: ChartProvider<string, number> = { ...this.seriesConfig, height: 340 };
  effectiveChartConfig: ChartProvider<string, number> = this.buildEffectiveChartConfig(this.chartConfig);

  private readonly compactData = [
    { team: 'Équipe A', value: 58, target: 64 },
    { team: 'Équipe B', value: 85, target: 78 },
    { team: 'Équipe C', value: 42, target: 51 },
    { team: 'Équipe D', value: 72, target: 68 },
    { team: 'Équipe E', value: 60, target: 74 },
  ];

  private readonly seriesData = [
    { month: 'Jan', value: 44, target: 50 },
    { month: 'Fév', value: 55, target: 58 },
    { month: 'Mar', value: 57, target: 61 },
    { month: 'Avr', value: 69, target: 65 },
    { month: 'Mai', value: 61, target: 70 },
    { month: 'Juin', value: 78, target: 74 },
  ];

  private loadVersion = 0;
  private loadTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.syncOrganizerChartTypes();
    this.loadChartData();
  }

  ngOnDestroy(): void {
    if (this.loadTimer) clearTimeout(this.loadTimer);
  }

  get selectedLibrary(): LibraryOption {
    return this.libraries.find(library => library.id === this.chartLibrary) ?? this.libraries[0];
  }

  get availableTypes(): readonly ChartExampleSection[] {
    return this.selectedLibrary.sections.filter(section => this.workbenchTypeIds.has(section.id));
  }

  get selectedTypeLabel(): string {
    return this.availableTypes.find(section => section.type === this.chartType)?.label ?? this.chartType;
  }

  trackByChartType(_index: number, section: ChartExampleSection): string {
    return section.type;
  }

  private buildEffectiveChartConfig(sourceConfig: ChartProvider<string, number>): ChartProvider<string, number> {
    const selectedFields = new Set(this.organizerMenuState.visibleFields ?? []);
    return {
      ...sourceConfig,
      series: sourceConfig.series?.filter(series =>
        typeof series.name !== 'string' || selectedFields.has(series.name)
      ),
    };
  }

  private updateEffectiveChartConfig(): void {
    this.effectiveChartConfig = this.buildEffectiveChartConfig(this.chartConfig);
  }

  private syncOrganizerChartTypes(): void {
    this.organizerMenuConfig = {
      ...this.organizerMenuConfig,
      chartTypes: this.availableTypes.map(section => ({
        id: section.type,
        label: section.label,
      })),
    };
  }

  private syncOrganizerChartTypeState(): void {
    this.organizerMenuState = {
      ...this.organizerMenuState,
      selectedChartType: this.chartType,
    };
  }

  get visibleSeriesCount(): number {
    return this.organizerMenuState.visibleFields?.length ?? 0;
  }

  get currentModeLabel(): string {
    return this.dataMode === 'compact' ? 'Échantillon compact' : 'Séries temporelles';
  }

  get currentLibraryRoute(): string {
    return `/charts/${this.chartLibrary}`;
  }

  loadChartData(): void {
    const currentLoad = ++this.loadVersion;
    this.isLoadingData = true;
    this.chartData = [];

    const config = this.dataMode === 'compact' ? this.compactConfig : this.seriesConfig;
    this.chartConfig = { ...config, height: 340 };
    this.updateEffectiveChartConfig();

    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      if (currentLoad !== this.loadVersion) return;
      const data = this.dataMode === 'compact' ? this.compactData : this.seriesData;
      this.chartData = [...data];
      this.isLoadingData = false;
    }, 180);
  }

  setLibrary(library: ChartLibrary): void {
    this.chartLibrary = library;
    if (!this.availableTypes.some(section => section.type === this.chartType)) {
      this.chartType = this.availableTypes[0]?.type ?? 'line';
    }
    this.syncOrganizerChartTypes();
    this.syncOrganizerChartTypeState();
    this.loadChartData();
  }

  setChartType(type: ChartType): void {
    if (!this.availableTypes.some(section => section.type === type)) return;
    this.chartType = type;
    this.syncOrganizerChartTypeState();
    this.loadChartData();
  }

  setDataMode(mode: DataMode): void {
    if (this.dataMode === mode) return;
    this.dataMode = mode;
    this.loadChartData();
  }

  reloadData(): void {
    this.loadChartData();
  }

  onOrganizerChange(event: OrganizerButtonEvent): void {
    const selectedChartType = event.state.selectedChartType as ChartType | undefined;
    const typeChanged = event.type === 'chartTypeSelected'
      && !!selectedChartType
      && this.availableTypes.some(section => section.type === selectedChartType);

    this.organizerMenuState = {
      ...event.state,
      selectedChartType: this.chartType,
    };

    if (typeChanged && selectedChartType) {
      this.chartType = selectedChartType;
      this.syncOrganizerChartTypeState();
      this.loadChartData();
      return;
    }

    this.updateEffectiveChartConfig();
  }

  readonly mapPreview = { config: mapChartConfig, data: mapChartData };
}
