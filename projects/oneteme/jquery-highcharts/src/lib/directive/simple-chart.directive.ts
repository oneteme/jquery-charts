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
    const previousType = this._options.chart?.type;

    // Détecter les changements pie/donut AVANT d'appliquer la nouvelle configuration
    const currentInnerSize = this._options.plotOptions?.pie?.innerSize;
    const newInnerSize = this.type === 'donut' ? '50%' : 0;

    // Si on change de pie à donut ou vice versa, forcer le redraw
    if (currentInnerSize !== newInnerSize) {
      if (this.debug) console.log('Changement pie/donut détecté:', currentInnerSize, '->', newInnerSize);
      this._shouldRedraw = true;
    }

    // Configuration spécifique au type
    configureSimpleGraphOptions(this._options, this.type, this.debug);

    // Forcer le redraw pour les types polaires/radar qui changent fondamentalement la structure
    if (this.isPolarType()) {
      this._shouldRedraw = true;
    }

    if (previousType !== actualType) {
      mergeDeep(this._options, { chart: { type: actualType } });
      this._shouldRedraw = true;
    }

    if (this.debug) console.log('_shouldRedraw après updateChartType:', this._shouldRedraw);
  }

  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    // Vérification de sécurité
    if (!this.config) {
      if (this.debug) console.log('Configuration manquante dans updateConfig');
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

    // Application des configurations spécifiques après merge
    configureSimpleGraphOptions(this._options, this.type, this.debug);
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données');

    // Vérifications de sécurité
    if (!this.config || !this.data) {
      if (this.debug) console.log('Configuration ou données manquantes dans updateData');
      // S'assurer que les séries sont vides pour éviter les erreurs
      mergeDeep(this._options, { series: [] });
      return;
    }

    try {
      const chartConfig = { ...this._chartConfig, continue: false };
      const commonChart = this.buildCommonChart(chartConfig);

      if (this.debug) console.log('Données traitées:', commonChart);

      if (this.isPolarType()) {
        this.handlePolarData(commonChart, chartConfig);
      } else {
        this.handlePieData(commonChart, chartConfig);
      }

      // Vérifier si on a des données valides mais pas de graphique existant
      if (this._options.series && Array.isArray(this._options.series) &&
          this._options.series.length > 0 &&
          this._options.series[0]?.data &&
          Array.isArray(this._options.series[0].data) &&
          this._options.series[0].data.length > 0 &&
          !this.chart && !this._shouldRedraw) {
        if (this.debug) console.log('Données valides détectées pour simple chart, force la création du graphique');
        this._shouldRedraw = true;
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données dans simple chart:', error);
      // En cas d'erreur, s'assurer que les options restent dans un état valide
      mergeDeep(this._options, { series: [] });
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
    try {
      if (!commonChart?.series || !Array.isArray(commonChart.series)) {
        mergeDeep(this._options, { series: [] });
        return;
      }

      const formattedData = commonChart.series
        .flatMap((s: { data: any[]; }) => Array.isArray(s.data) ? s.data.filter((d: null) => d != null) : [])
        .map((data: any, index: string | number) => ({
          name: commonChart?.categories?.[index] ?? `Item ${index}`,
          y: typeof data === 'number' ? data : 0,
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
    } catch (error) {
      console.error('Erreur lors du formatage des données pie:', error);
      mergeDeep(this._options, { series: [] });
    }
  }
}
