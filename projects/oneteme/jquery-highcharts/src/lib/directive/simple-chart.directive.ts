import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { buildSingleSerieChart, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { isPolarChartType, isSimpleChartType, getActualHighchartsType } from './utils/chart-utils';
import { ConfigurationManager } from './utils/config-manager';
import { SimpleChartHandlerFactory } from './utils/charts-handlers/simple-handlers';

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

    this._options = ConfigurationManager.applyUserConfigWithTransformation(
      this._options,
      this.config,
      this.type,
      this.debug
    );

    const needsDataUpdate = ConfigurationManager.handlePolarChartSpecifics(
      this._options,
      this.type,
      this.debug
    );

    if (isPolarChartType(this.type)) {
      this._shouldRedraw = true;
      // Si on entre dans un type polaire depuis un non-polaire, il faut régénérer catégories/series
      if (!wasPolar) {
        this.debug && console.log('Entrée vers un type polaire détectée, re-génération des données');
        this._options.series = [];
        this.updateData();
      } else if (needsDataUpdate) {
        this.debug && console.log('Mise à jour des données nécessaire pour graphique polaire');
      }
    }

    if (previousType !== actualType) {
      mergeDeep(this._options, { chart: { type: actualType } });
      this._shouldRedraw = true;
      // Forcer une régénération des données lors d'un changement de type simple
      if (isSimpleChartType(this.type)) {
        this._options.series = [];
        this.updateData();
      }
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
      }
    );

    this._options = ConfigurationManager.applyUserConfigWithTransformation(
      this._options,
      this._chartConfig,
      this.type,
      this.debug
    );
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
  const shouldForceSimpleHandler = hasPolarProperties && isCurrentSimpleType && !isPolarChartType(this.type);

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

      this.debug && console.log('Données traitées (commonChart):', commonChart);

  const handlerType = shouldForceSimpleHandler ? 'pie' : this.type;
      const handler = SimpleChartHandlerFactory.getHandler(handlerType);

      if (!handler) {
        this.debug && console.warn('Aucun handler simple trouvé pour', handlerType);
        mergeDeep(this._options, { series: [] });
        return;
      }

      const result = handler.handle(commonChart, this._chartConfig, handlerType, this.debug);
      mergeDeep(this._options, result);

      const hasSeries = Array.isArray(result?.series) && result.series.length > 0;
      const firstData = hasSeries && Array.isArray(result.series[0]?.data)
        ? result.series[0].data
        : [];
      if (hasSeries && firstData.length > 0 && !this.chart && !this._shouldRedraw) {
        this.debug && console.log('Données valides détectées pour simple chart, force la création du graphique');
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
}
