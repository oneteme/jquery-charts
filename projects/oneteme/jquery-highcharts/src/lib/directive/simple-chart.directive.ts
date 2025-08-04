import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildSingleSerieChart, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configureSimpleGraphOptions } from './utils/chart-options';
import { Highcharts } from './utils/highcharts-modules';
import { generateDistinctColors, isPolarChartType, isSimpleChartType, getActualHighchartsType } from './utils/chart-utils';

@Directive({
  selector: '[simple-chart]',
  standalone: true,
})
export class SimpleChartDirective extends BaseChartDirective<string, number> {
  @Input({ alias: 'type' }) override type: 'pie' | 'donut' | 'polar' | 'radar' | 'radarArea' | 'funnel' | 'pyramid' | 'radialBar' = 'pie';
  private _previousType: string | null = null;

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    this.debug && console.log('Mise à jour du type de graphique:', this.type);

    const actualType = getActualHighchartsType(this.type);
    const previousType = this._options.chart?.type;
    const wasPolar = this._options.chart?.polar === true;
    const isPolar = isPolarChartType(this.type);

    if (wasPolar !== isPolar || (wasPolar && isPolar)) {
      this.debug && console.log('Transition polaire détectée, force redraw');
      this._shouldRedraw = true;
    }

    const isPolarToSimple = wasPolar && isSimpleChartType(this.type);

    this.debug && console.log('updateChartType: Détection polar->simple', {
      wasPolar,
      currentType: this.type,
      isPolarToSimple
    });

    const currentInnerSize = this._options.plotOptions?.pie?.innerSize;
    const newInnerSize = this.type === 'donut' ? '50%' : 0;

    if (currentInnerSize !== newInnerSize) {
      this.debug &&
        console.log(
          'Changement pie/donut détecté:',
          currentInnerSize,
          '->',
          newInnerSize
        );
      this._shouldRedraw = true;
    }

    configureSimpleGraphOptions(this._options, this.type, this.debug);

    if (isPolarChartType(this.type)) this._shouldRedraw = true;

    if (previousType !== actualType) {
      mergeDeep(this._options, { chart: { type: actualType } });
      this._shouldRedraw = true;
    }

    if (isPolarToSimple) {
      this.debug && console.log('updateChartType: FORCE updateData() pour transition polar->simple');
      this._options.series = [];
      this.updateData();
    }

    const previousTypeFromRadar = this._previousType === 'radar' || this._previousType === 'radarArea';
    const currentTypeIsRadar = this.type === 'radar' || this.type === 'radarArea';

    const isRadarToRadarAreaSwitch = (this._previousType === 'radar' && this.type === 'radarArea') || (this._previousType === 'radarArea' && this.type === 'radar');

    if (previousTypeFromRadar !== currentTypeIsRadar || isRadarToRadarAreaSwitch) {
      this.debug && console.log('Changement vers/depuis/entre radar/radarArea détecté, retraitement des données nécessaire');
      this._options.series = [];
      this.updateData();
    }
    this._previousType = this.type;

    this.debug &&
      console.log('_shouldRedraw après updateChartType:', this._shouldRedraw);
  }

  protected override updateConfig(): void {
    this.debug && console.log('Mise à jour de la configuration');

    if (!this.config) {
      this.debug && console.log('Configuration manquante dans updateConfig');
      return;
    }

    this._chartConfig = this.config;
    const actualType = getActualHighchartsType(this.type);

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

    configureSimpleGraphOptions(this._options, this.type, this.debug);
  }

  protected override updateData(): void {
    this.debug && console.log('updateData: Début avec type:', this.type);

    if (!this.config || !this.data) {
      this.debug &&
        console.log('Configuration ou données manquantes dans updateData');
      mergeDeep(this._options, { series: [] });
      return;
    }

    const hasPolarProperties = !!(
      this._options.chart?.polar === true ||
      this._options.pane !== undefined
    );

    const isCurrentSimpleType = isSimpleChartType(this.type);
    const shouldForceSimpleHandler = hasPolarProperties && isCurrentSimpleType;

    this.debug && console.log('updateData: Analyse properties', {
      type: this.type,
      hasPolarProperties,
      isCurrentSimpleType,
      shouldForceSimpleHandler,
      chartPolar: this._options.chart?.polar,
      hasPane: this._options.pane !== undefined
    });

    try {
      const chartConfig = { ...this._chartConfig, continue: false };
      const commonChart = this.buildCommonChart(chartConfig);

      this.debug && console.log('Données traitées:', commonChart);

      if (shouldForceSimpleHandler) {
        this.debug && console.log('updateData: FORCE handlePieData (polar->simple detected)');
        this.handlePieData(commonChart, chartConfig);
      } else if (isPolarChartType(this.type)) {
        this.debug && console.log('updateData: Using handlePolarData');
        this.handlePolarData(commonChart, chartConfig);
      } else {
        this.debug && console.log('updateData: Using handlePieData');
        this.handlePieData(commonChart, chartConfig);
      }

      if (
        this._options.series &&
        Array.isArray(this._options.series) &&
        this._options.series.length > 0 &&
        this._options.series[0]?.data &&
        Array.isArray(this._options.series[0].data) &&
        this._options.series[0].data.length > 0 &&
        !this.chart &&
        !this._shouldRedraw
      ) {
        this.debug &&
          console.log(
            'Données valides détectées pour simple chart, force la création du graphique'
          );
        this._shouldRedraw = true;
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données dans simple chart:', error);
      mergeDeep(this._options, { series: [] });
    }
  }

  private buildCommonChart(chartConfig: any) {
    const hasMultipleSeries = this.config.series?.length > 1;
    const hasNameFunction = typeof this.config.series?.[0]?.name === 'function';

    const shouldUseMultiSeries = (this.type === 'radar' || this.type === 'radarArea') && (hasMultipleSeries || hasNameFunction);

    this.debug && console.log('buildCommonChart analysis:', {
      type: this.type,
      hasMultipleSeries,
      hasNameFunction,
      shouldUseMultiSeries,
      configSeriesLength: this.config.series?.length,
      firstSeriesName: this.config.series?.[0]?.name,
      isNameFunction: typeof this.config.series?.[0]?.name === 'function'
    });

    return shouldUseMultiSeries
      ? buildChart(this.data, chartConfig, null)
      : buildSingleSerieChart(this.data, chartConfig, null);
  }

  private handlePolarData(commonChart: any, chartConfig: any): void {
    if (!this._options.xAxis || Array.isArray(this._options.xAxis)) {
      this._options.xAxis = {};
    }
    this._options.xAxis.categories = commonChart.categories ?? [];

    const hasMultipleSeries = this.config.series?.length > 1;
    const hasNameFunction = typeof this.config.series?.[0]?.name === 'function';
    const shouldUseMultiSeries = (this.type === 'radar' || this.type === 'radarArea') && (hasMultipleSeries || hasNameFunction);

    this.debug && console.log('handlePolarData analysis:', {
      type: this.type,
      shouldUseMultiSeries,
      commonChartSeries: commonChart.series,
      seriesCount: commonChart.series?.length
    });

    const series = shouldUseMultiSeries
      ? this.createMultiRadarSeries(commonChart, chartConfig)
      : this.createSinglePolarSeries(commonChart, chartConfig);

    mergeDeep(this._options, { series });
  }

  private createMultiRadarSeries(commonChart: any, chartConfig: any): any[] {
    return commonChart.series.map(
      (serie: { name: any; data: any[]; color: any }) => {
        let seriesType = 'column'; // valeur par défaut
        if (this.type === 'radar') {
          seriesType = 'line';
        } else if (this.type === 'radarArea') {
          seriesType = 'area';
        }

        return {
          name: serie.name ?? chartConfig.xtitle ?? 'Série',
          data: serie.data.map((value, index) => ({
            name: commonChart.categories[index],
            y: value,
          })),
          pointPlacement: 'on',
          color: serie.color,
          type: seriesType,
        };
      }
    );
  }

  private createSinglePolarSeries(commonChart: any, chartConfig: any): any[] {
    let seriesType = 'column';
    if (this.type === 'radar') {
      seriesType = 'line';
    } else if (this.type === 'radarArea') {
      seriesType = 'area';
    }

    const isRadarType = this.type === 'radar' || this.type === 'radarArea';

    let formattedData;
    let seriesColor;

    if (isRadarType) {
      formattedData = commonChart.categories.map(
        (category: any, i: string | number) => ({
          name: category,
          y: commonChart.series[0]?.data[i] ?? 0,
        })
      );
      seriesColor = (Highcharts as any).getOptions().colors[0];
    } else {
      const colors = generateDistinctColors(commonChart.categories.length);
      formattedData = commonChart.categories.map(
        (category: any, i: string | number) => ({
          name: category,
          y: commonChart.series[0]?.data[i] ?? 0,
          color: colors[i],
        })
      );
    }

    return [{
        name: chartConfig.title ?? 'Valeurs',
        data: formattedData,
        type: seriesType,
        showInLegend: true,
        ...(isRadarType && seriesColor ? { color: seriesColor } : {}),
      }];
  }

  private handlePieData(commonChart: any, chartConfig: any): void {
    try {
      if (!commonChart?.series || !Array.isArray(commonChart.series)) {
        mergeDeep(this._options, { series: [] });
        return;
      }

      const flatData = commonChart.series
        .flatMap((s: { data: any[] }) =>
          Array.isArray(s.data) ? s.data.filter((d: null) => d != null) : []
        );

      const colors = generateDistinctColors(flatData.length);

      const formattedData = flatData.map((data: any, index: string | number) => ({
        name: commonChart?.categories?.[index] ?? `Item ${index}`,
        y: typeof data === 'number' ? data : 0,
        color: colors[index],
      }));

      this.debug && console.log('Données formatées:', formattedData);

      mergeDeep(this._options, {
        series: [
          {
            name: chartConfig.title ?? 'Valeurs',
            data: formattedData,
            showInLegend: true,
          },
        ],
      });
    } catch (error) {
      console.error('Erreur lors du formatage des données pie:', error);
      mergeDeep(this._options, { series: [] });
    }
  }
}
