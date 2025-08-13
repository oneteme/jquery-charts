import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { XaxisType, YaxisType, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { configureComplexGraphOptions } from './utils/chart-options';
import { ChartCleaner } from './utils/chart-cleaners';
import { ChartHandlerFactory } from './utils/charts-handlers/complex-handlers';

@Directive({
  selector: '[complex-chart]',
  standalone: true,
})
export class ComplexChartDirective<
  X extends XaxisType
> extends BaseChartDirective<X, YaxisType> {
  @Input({ alias: 'type' }) override type: 'bar' | 'column' | 'columnpyramid' | 'line' | 'area' | 'spline' | 'areaspline' | 'columnrange' | 'arearange' | 'areasplinerange' | 'scatter' | 'bubble' | 'heatmap' | 'treemap' | 'boxplot' = 'bar';

  constructor() {
    super(inject(ElementRef), inject(NgZone));
  }

  protected override updateChartType(): void {
    this.debug && console.log('Mise à jour du type de graphique:', this.type);

    const previousType = this._options.chart?.type;
  const wasSpecialType = previousType === 'treemap' || previousType === 'heatmap';
  const isSpecialType = this.type === 'treemap' || this.type === 'heatmap';
    const wasScatterBubble = previousType === 'scatter' || previousType === 'bubble';
    const isScatterBubble = this.type === 'scatter' || this.type === 'bubble';
  const wasBoxplot = previousType === 'boxplot';
  const isBoxplot = this.type === 'boxplot';

    if (wasSpecialType !== isSpecialType ||
        (wasSpecialType && isSpecialType && previousType !== this.type) ||
        (wasScatterBubble && previousType !== this.type) ||
        (isScatterBubble && previousType !== this.type) ||
        (wasBoxplot || isBoxplot) && previousType !== this.type) {
      this.debug && console.log('Transition critique détectée, nettoyage nécessaire');
      this._shouldRedraw = true;

      if (wasSpecialType && !isSpecialType) {
        ChartCleaner.cleanAllSpecialConfigs(this._options, true);
        this.debug && console.log('Configurations spéciales nettoyées (externalisé)');
      } else if ((wasScatterBubble || isScatterBubble) && previousType !== this.type) {
        ChartCleaner.cleanForChartType(this._options, 'scatter', true);
        ChartCleaner.cleanForChartType(this._options, 'bubble', true);
        this.debug && console.log('Configurations scatter/bubble nettoyées (externalisé)');
      }

      if ((wasBoxplot || isBoxplot) && previousType !== this.type) {
        ChartCleaner.cleanForChartType(this._options, 'boxplot', true);
      }
    }

    if (this._options.chart?.type !== this.type) {
      mergeDeep(this._options, {
        chart: { type: this.type },
      });
      this._shouldRedraw = true;
    }

    if (this.type === 'treemap' || this.type === 'heatmap' || this.type === 'scatter' || this.type === 'bubble') {
      const hasAlreadyConfigured = !!this._options.plotOptions && !!this._options.plotOptions[this.type];
      if (!hasAlreadyConfigured) {
        configureComplexGraphOptions(this._options, this.type, this.debug);
      } else {
        this.debug && console.log('Configuration complexe déjà appliquée, skip', this.type);
      }
    }

    if (previousType !== this.type) {
      this.debug && console.log('Type de graphique changé, retraitement des données nécessaire');
      this.updateData();
    }
  }

  protected override updateConfig(): void {
    if (this.debug) console.log('Mise à jour de la configuration');

    if (!this.config) {
      this.debug && console.log('Configuration manquante dans updateConfig');
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
        tooltip: (this.type === 'treemap' || this.type === 'heatmap' || this.type === 'scatter' || this.type === 'bubble' || this.type === 'boxplot') ? {} : {
          shared: true,
        },
      },
      this._chartConfig.options ?? {}
    );

    if (this.type === 'treemap' || this.type === 'heatmap' || this.type === 'scatter' || this.type === 'bubble') {
      if (this.type === 'scatter' || this.type === 'bubble') {
        ChartCleaner.cleanForChartType(this._options, 'scatter', true);
        ChartCleaner.cleanForChartType(this._options, 'bubble', true);
        this.debug && console.log('Configurations scatter/bubble nettoyées (externalisé)');
      }
      configureComplexGraphOptions(this._options, this.type, this.debug);
    } else if (this.type === 'boxplot') {
      // Nettoyage ciblé pour boxplot, pas de configuration via chart-options
      ChartCleaner.cleanForChartType(this._options, 'boxplot', true);
    }
  }

  protected override updateData(): void {
    if (this.debug) console.log('Mise à jour des données pour le type:', this.type);

    if (!this.config || !this.data) {
      if (this.debug)
        console.log('Configuration ou données manquantes dans updateData');
      mergeDeep(this._options, { series: [] });
      return;
    }

    try {
  const handlerType = ['treemap', 'heatmap', 'scatter', 'bubble', 'boxplot'].includes(this.type)
        ? this.type
        : 'standard';

      const handler = ChartHandlerFactory.createHandler(handlerType);
      const result = handler.handle(this.data, this._chartConfig, this.debug);

      if (result && typeof result === 'object') {
        const { shouldRedraw, ...rest } = result;
        mergeDeep(this._options, rest);

        if (shouldRedraw && !this.chart && !this._shouldRedraw) {
          this._shouldRedraw = true;
        }
      } else {
        mergeDeep(this._options, { series: [] });
      }

    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
      mergeDeep(this._options, {
        series: [],
        xAxis: { categories: [] },
      });
    }
  }
}
