import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { XaxisType, YaxisType, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { getType } from './utils/chart-utils';

@Directive({
  selector: '[complex-chart]',
  standalone: true,
})
export class ComplexChartDirective<
  X extends XaxisType
> extends BaseChartDirective<X, YaxisType> {
  @Input({ alias: 'type' }) override type: 'bar' | 'column' | 'columnpyramid' | 'line' | 'area' | 'spline' | 'areaspline' | 'columnrange' | 'arearange' | 'areasplinerange' | 'scatter' | 'bubble' | 'heatmap' | 'treemap' = 'bar';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    if (this._options.chart?.type !== this.type) {
      mergeDeep(this._options, {
        chart: { type: this.type },
      });
      this._shouldRedraw = true;
    }
  }

  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    // Vérification de sécurité
    if (!this.config) {
      if (this.debug) console.log('Configuration manquante dans updateConfig');
      return;
    }

    this._chartConfig = this.config;

    this._options = mergeDeep(
      {},
      this._options,
      {
        chart: {
          type: this.type,
          height: this._chartConfig.height ?? '100%',
          width: this._chartConfig.width ?? '100%',
          stacked: this._chartConfig.stacked,
        },
        title: {
          text: this._chartConfig.title,
        },
        subtitle: {
          text: this._chartConfig.subtitle,
        },
        xAxis: {
          title: {
            text: this._chartConfig.xtitle,
          },
        },
        yAxis: {
          title: {
            text: this._chartConfig.ytitle,
          },
        },
        plotOptions: {
          series: {
            stacking: this._chartConfig.stacked ? 'normal' : undefined,
          },
        },
        tooltip: {
          shared: true,
        },
      },
      this._chartConfig.options ?? {}
    );
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
      const commonChart = buildChart(this.data, chartConfig, null);

      if (this.debug) console.log('Données traitées:', commonChart);

      const xAxisType = getType(commonChart);

      if (this.debug) console.log("Type d'axe X détecté:", xAxisType);

      if (commonChart?.categories && commonChart?.series) {
        // Validation des données avant mise à jour
        const validSeries = Array.isArray(commonChart.series) ? commonChart.series : [];
        const validCategories = Array.isArray(commonChart.categories) ? commonChart.categories : [];

        mergeDeep(this._options, {
          xAxis: {
            categories: validCategories,
            type: xAxisType,
          },
          series: validSeries,
        });

        // Si on a des données valides mais pas de graphique existant, forcer la création
        if (validSeries.length > 0 && !this.chart && !this._shouldRedraw) {
          if (this.debug) console.log('Données valides détectées, force la création du graphique');
          this._shouldRedraw = true;
        }
      } else {
        if (this.debug) console.log('Données temporairement vides, attente des vraies données');
        // S'assurer que les séries sont définies comme un tableau vide
        mergeDeep(this._options, {
          series: [],
          xAxis: { categories: [] }
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
      // En cas d'erreur, s'assurer que les options restent dans un état valide
      mergeDeep(this._options, {
        series: [],
        xAxis: { categories: [] }
      });
    }
  }
}
