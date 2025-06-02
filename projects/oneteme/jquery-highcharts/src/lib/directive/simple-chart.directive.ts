import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildSingleSerieChart, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configureSimpleGraphOptions } from './utils/chart-options';

@Directive({
  selector: '[simple-chart]',
  standalone: true,
})
export class SimpleChartDirective extends BaseChartDirective<string, number> {
  @Input({ alias: 'type' }) override type: 'pie' | 'donut' | 'polar' | 'radar' | 'funnel' | 'pyramid' | 'radialBar' = 'pie';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    const actualType = this.getActualChartType();

    // Configuration spécifique au type
    configureSimpleGraphOptions(this._options, this.type, this.debug);

    // Forcer le redraw pour les types polaires/radar qui changent fondamentalement la structure
    if (this.isPolarType()) {
      this._shouldRedraw = true;
    }

    if (this._options.chart?.type !== actualType) {
      mergeDeep(this._options, { chart: { type: actualType } });
      this._shouldRedraw = true;
    }
  }

  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    this._chartConfig = this.config;
    const actualType = this.getActualChartType();

    this._options = mergeDeep(
      {},
      this._options,
      {
        chart: {
          type: actualType,
          height: this._chartConfig.height ?? '100%',
          width: this._chartConfig.width ?? '100%',
        },
        title: { text: this._chartConfig.title },
        subtitle: { text: this._chartConfig.subtitle },
        exporting: { enabled: this._chartConfig.showToolbar ?? true },
        plotOptions: {
          series: {
            dataLabels: { enabled: true },
          },
        },
      },
      this._chartConfig.options ?? {}
    );

    // Application des configurations spécifiques après merge
    configureSimpleGraphOptions(this._options, this.type, this.debug);
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données');

    const chartConfig = { ...this._chartConfig, continue: false };
    const commonChart = this.buildCommonChart(chartConfig);

    if (this.debug) console.log('Données traitées:', commonChart);

    if (this.isPolarType()) {
      this.handlePolarData(commonChart, chartConfig);
    } else {
      this.handlePieData(commonChart, chartConfig);
    }
  }

  // Méthodes utilitaires privées
  private getActualChartType(): string {
    return this.type === 'donut' ? 'pie' : this.type;
  }

  private isPolarType(): boolean {
    return ['polar', 'radar', 'radialBar'].includes(this.type);
  }

  private buildCommonChart(chartConfig: any) {
    return this.data.length !== 1 && this.type === 'radar'
      ? buildChart(this.data, chartConfig, null)
      : buildSingleSerieChart(this.data, chartConfig, null);
  }

  private handlePolarData(commonChart: any, chartConfig: any): void {
    // Assurer que xAxis existe et est un objet
    if (!this._options.xAxis || Array.isArray(this._options.xAxis)) {
      this._options.xAxis = {};
    }
    this._options.xAxis.categories = commonChart.categories ?? [];

    const series =
      this.data.length !== 1 && this.type === 'radar'
        ? this.createMultiRadarSeries(commonChart, chartConfig)
        : this.createSinglePolarSeries(commonChart, chartConfig);

    mergeDeep(this._options, { series });
  }

  private createMultiRadarSeries(commonChart: any, chartConfig: any): any[] {
    return commonChart.series.map((serie: { name: any; data: any[]; color: any; }) => ({
      name: serie.name ?? chartConfig.xtitle ?? 'Série',
      data: serie.data.map((value, index) => ({
        name: commonChart.categories[index],
        y: value,
      })),
      pointPlacement: 'on',
      color: serie.color,
      type: this.type === 'radar' ? 'line' : 'column',
    }));
  }

  private createSinglePolarSeries(commonChart: any, chartConfig: any): any[] {
    const formattedData = commonChart.categories.map((category: any, i: string | number) => ({
      name: category,
      y: commonChart.series[0]?.data[i] ?? 0,
      color: commonChart.series[0]?.color,
    }));

    return [
      {
        name: chartConfig.title ?? 'Valeurs',
        data: formattedData,
        type: this.type === 'radar' ? 'line' : 'column',
        showInLegend: true,
      },
    ];
  }

  private handlePieData(commonChart: any, chartConfig: any): void {
    const formattedData = commonChart.series
      .flatMap((s: { data: any[]; }) => s.data.filter((d: null) => d != null))
      .map((data: any, index: string | number) => ({
        name: commonChart.categories[index],
        y: data,
        ...(commonChart.series[0]?.color && {
          color: commonChart.series[0].color,
        }),
      }));

    if (this.debug) console.log('Données formatées:', formattedData);

    mergeDeep(this._options, {
      series: [
        {
          name: chartConfig.title ?? 'Valeurs',
          data: formattedData,
          showInLegend: true,
        },
      ],
    });
  }
}
