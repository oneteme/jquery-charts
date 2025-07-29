import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildSingleSerieChart, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configureSimpleGraphOptions } from './utils/chart-options';
import { Highcharts } from './utils/highcharts-modules';

@Directive({
  selector: '[simple-chart]',
  standalone: true,
})
export class SimpleChartDirective extends BaseChartDirective<string, number> {
  @Input({ alias: 'type' }) override type: 'pie' | 'donut' | 'polar' | 'radar' | 'funnel' | 'pyramid' | 'radialBar' = 'pie';
  private _previousType: string | null = null;

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    this.debug && console.log('Mise à jour du type de graphique:', this.type);

    const actualType = this.getActualChartType();
    const previousType = this._options.chart?.type;
    const wasPolar = this._options.chart?.polar === true;
    const isPolar = this.isPolarType();

    // Détecter les transitions entre types polaires ou depuis/vers polaire
    if (wasPolar !== isPolar || (wasPolar && isPolar)) {
      this.debug && console.log('Transition polaire détectée, force redraw');
      this._shouldRedraw = true;
    }

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

    if (this.isPolarType()) this._shouldRedraw = true;

    if (previousType !== actualType) {
      mergeDeep(this._options, { chart: { type: actualType } });
      this._shouldRedraw = true;
    }

    // Si on passe vers ou depuis un graphique radar, il faut retraiter les données
    // car radar peut utiliser des séries multiples même si le type précédent utilisait une série unique
    const previousTypeFromRadar = this._previousType === 'radar';
    const currentTypeIsRadar = this.type === 'radar';
    
    if (previousTypeFromRadar !== currentTypeIsRadar) {
      this.debug && console.log('Changement vers/depuis radar détecté, retraitement des données nécessaire');
      // Forcer le retraitement des données
      this.updateData();
    }

    // Sauvegarder le type actuel pour la prochaine fois
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

    configureSimpleGraphOptions(this._options, this.type, this.debug);
  }

  protected override updateData(): void {
    this.debug && console.log('Mise à jour des données');

    if (!this.config || !this.data) {
      this.debug &&
        console.log('Configuration ou données manquantes dans updateData');
      mergeDeep(this._options, { series: [] });
      return;
    }

    try {
      const chartConfig = { ...this._chartConfig, continue: false };
      const commonChart = this.buildCommonChart(chartConfig);

      this.debug && console.log('Données traitées:', commonChart);

      if (this.isPolarType()) {
        this.handlePolarData(commonChart, chartConfig);
      } else {
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
      console.error(
        'Erreur lors du traitement des données dans simple chart:',
        error
      );
      mergeDeep(this._options, { series: [] });
    }
  }
  private getActualChartType(): string {
    if (this.type === 'donut') {
      return 'pie';
    }

    // Pour les graphiques polaires, retourner le type de base approprié
    if (this.type === 'polar' || this.type === 'radialBar') {
      return 'column';
    }

    if (this.type === 'radar') {
      return 'line';
    }

    return this.type;
  }

  private isPolarType(): boolean {
    return ['polar', 'radar', 'radialBar'].includes(this.type);
  }

  private buildCommonChart(chartConfig: any) {
    // Debug : analyser la configuration pour comprendre la structure des données
    const hasMultipleSeries = this.config.series?.length > 1;
    const hasNameFunction = typeof this.config.series?.[0]?.name === 'function';
    
    // Pour un graphique radar, on utilise buildChart (multi-séries) si :
    // 1. Il y a plusieurs séries définies dans la config, OU
    // 2. Il y a une fonction name (qui génère des séries dynamiques)
    const shouldUseMultiSeries = this.type === 'radar' && (hasMultipleSeries || hasNameFunction);
    
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

    // Utiliser la même logique que dans buildCommonChart
    const hasMultipleSeries = this.config.series?.length > 1;
    const hasNameFunction = typeof this.config.series?.[0]?.name === 'function';
    const shouldUseMultiSeries = this.type === 'radar' && (hasMultipleSeries || hasNameFunction);

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
      (serie: { name: any; data: any[]; color: any }) => ({
        name: serie.name ?? chartConfig.xtitle ?? 'Série',
        data: serie.data.map((value, index) => ({
          name: commonChart.categories[index],
          y: value,
        })),
        pointPlacement: 'on',
        color: serie.color,
        type: this.type === 'radar' ? 'line' : 'column',
      })
    );
  }

  private createSinglePolarSeries(commonChart: any, chartConfig: any): any[] {
    // Générer des couleurs distinctes pour chaque point de données
    const colors = this.generateDistinctColors(commonChart.categories.length);

    const formattedData = commonChart.categories.map(
      (category: any, i: string | number) => ({
        name: category,
        y: commonChart.series[0]?.data[i] ?? 0,
        color: colors[i], // Assigner une couleur unique à chaque point
      })
    );

    return [
      {
        name: chartConfig.title ?? 'Valeurs',
        data: formattedData,
        type: this.type === 'radar' ? 'line' : 'column',
        showInLegend: true,
      },
    ];
  }

  /**
   * Génère des couleurs distinctes pour les graphiques polaires
   * Utilise la palette de couleurs par défaut de Highcharts
   */
  private generateDistinctColors(count: number): string[] {
    // Utiliser les couleurs par défaut de Highcharts depuis les options globales
    const highchartsColors = (Highcharts as any).getOptions().colors || [
      '#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9',
      '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(highchartsColors[i % highchartsColors.length]);
    }

    return colors;
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

      // Générer des couleurs distinctes pour chaque point
      const colors = this.generateDistinctColors(flatData.length);

      const formattedData = flatData.map((data: any, index: string | number) => ({
        name: commonChart?.categories?.[index] ?? `Item ${index}`,
        y: typeof data === 'number' ? data : 0,
        color: colors[index], // Utiliser les couleurs générées
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
