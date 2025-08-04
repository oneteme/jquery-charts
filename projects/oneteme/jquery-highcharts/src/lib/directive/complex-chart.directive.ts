import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { XaxisType, YaxisType, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { getType, validateSpecialChartData } from './utils/chart-utils';
import { configureComplexGraphOptions } from './utils/chart-options';

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
    this.debug && console.log('Mise à jour du type de graphique:', this.type);

    const previousType = this._options.chart?.type;
    const wasSpecialType = previousType === 'treemap' || previousType === 'heatmap';
    const isSpecialType = this.type === 'treemap' || this.type === 'heatmap';

    if (wasSpecialType !== isSpecialType || (wasSpecialType && isSpecialType && previousType !== this.type)) {
      this.debug && console.log('Transition vers/depuis type spécial détectée, force redraw');
      this._shouldRedraw = true;

      if (wasSpecialType && !isSpecialType) {
        this.cleanSpecialChartConfigs();
      }
    }

    if (this._options.chart?.type !== this.type) {
      mergeDeep(this._options, {
        chart: { type: this.type },
      });
      this._shouldRedraw = true;
    }

    if (this.type === 'treemap' || this.type === 'heatmap') {
      configureComplexGraphOptions(this._options, this.type, this.debug);
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
        tooltip: {
          shared: true,
        },
      },
      this._chartConfig.options ?? {}
    );

    if (this.type === 'treemap' || this.type === 'heatmap') {
      configureComplexGraphOptions(this._options, this.type, this.debug);
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
      if (this.type === 'treemap') {
        this.handleTreemapData();
        return;
      }

      if (this.type === 'heatmap') {
        this.handleHeatmapData();
        return;
      }

      this.handleStandardData();

    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
      mergeDeep(this._options, {
        series: [],
        xAxis: { categories: [] },
      });
    }
  }

  private handleStandardData(): void {
    const chartConfig = { ...this._chartConfig, continue: false };
    const commonChart = buildChart(this.data, chartConfig, null);

    if (this.debug) console.log('Données traitées pour graphique standard:', commonChart);

    const xAxisType = getType(commonChart);

    this.debug && console.log("Type d'axe X détecté:", xAxisType);

    if (commonChart?.categories && commonChart?.series) {
      const validSeries = Array.isArray(commonChart.series)
        ? commonChart.series
        : [];
      const validCategories = Array.isArray(commonChart.categories)
        ? commonChart.categories
        : [];

      mergeDeep(this._options, {
        xAxis: {
          categories: validCategories,
          type: xAxisType,
        },
        series: validSeries,
      });

      if (validSeries.length > 0 && !this.chart && !this._shouldRedraw) {
        this.debug &&
          console.log(
            'Données valides détectées pour graphique standard, force la création du graphique'
          );
        this._shouldRedraw = true;
      }
    } else {
      this.debug &&
        console.log(
          'Données temporairement vides, attente des vraies données'
        );
      mergeDeep(this._options, {
        series: [],
        xAxis: { categories: [] },
      });
    }
  }

  private handleTreemapData(): void {
    try {
      this.debug && console.log('Traitement des données treemap:', this.data);

      if (!validateSpecialChartData(this.data, 'treemap')) {
        this.debug && console.log('Données non optimales pour treemap, adaptation en cours...');

        const treemapData = this.data.map((item: any, index: number) => {
          const name = item.category || item.month || item.name || `Item ${index + 1}`;
          const value = Math.abs(typeof item.value === 'number' ? item.value : (item.y || 0));

          return {
            name: name,
            value: value,
            colorValue: item.value || item.y || value,
          };
        });

        this.debug && console.log('Données treemap adaptées:', treemapData);

        mergeDeep(this._options, {
          series: [
            {
              type: 'treemap',
              name: this._chartConfig.title ?? 'Données',
              data: treemapData,
              layoutAlgorithm: 'squarified',
            },
          ],
        });
      } else {
        const treemapData = this.data.map((item: any, index: number) => ({
          name: item.month ?? item.category ?? item.name ?? `Item ${index + 1}`,
          value: Math.abs(item.value),
          colorValue: item.value,
          team: item.team ?? 'Groupe principal',
        }));

        const groupedData = this.groupTreemapData(treemapData);

        this.debug && console.log('Données treemap formatées:', groupedData);

        mergeDeep(this._options, {
          series: [
            {
              type: 'treemap',
              name: this._chartConfig.title ?? 'Données',
              data: groupedData,
              layoutAlgorithm: 'squarified',
            },
          ],
        });
      }

      if (!this.chart && !this._shouldRedraw) {
        this._shouldRedraw = true;
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données treemap:', error);
      mergeDeep(this._options, { series: [] });
    }
  }

  private groupTreemapData(data: any[]): any[] {
    const grouped = new Map();

    data.forEach((item) => {
      const group = item.team ?? 'Principal';
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group).push(item);
    });

    const result: any[] = [];
    let parentId = 0;

    grouped.forEach((items, groupName) => {
      const parentItem = {
        id: `parent-${parentId}`,
        name: groupName,
        value: items.reduce((sum: number, item: any) => sum + item.value, 0),
      };

      result.push(parentItem);

      items.forEach((item: any, index: number) => {
        result.push({
          name: item.name,
          parent: parentItem.id,
          value: item.value,
          colorValue: item.colorValue,
        });
      });
      parentId++;
    });
    return result;
  }

  private handleHeatmapData(): void {
    try {
      if (this.debug) console.log('Traitement des données heatmap:', this.data);

      if (!validateSpecialChartData(this.data, 'heatmap')) {
        this.debug && console.log('Données non optimales pour heatmap, adaptation en cours...');

        const categories = this.data.map((item, index) =>
          item.category || item.month || item.name || `Item ${index + 1}`
        );

        const heatmapData: number[][] = this.data.map((item: any, index: number) => [ index, 0, typeof item.value === 'number' ? item.value : (item.y || 0)
        ]);

        this.debug && console.log('Données heatmap adaptées:', { categories, data: heatmapData });

        mergeDeep(this._options, {
          xAxis: {
            categories: categories,
            title: { text: this._chartConfig.xtitle },
          },
          yAxis: {
            categories: ['Valeurs'],
            title: { text: this._chartConfig.ytitle },
          },
          series: [
            {
              type: 'heatmap',
              name: this._chartConfig.title ?? 'Données',
              data: heatmapData,
              dataLabels: {
                enabled: true,
                color: '#000000',
              },
            },
          ],
        });
      } else {
        const categories = Array.from(
          new Set(
            this.data.map((item) => item.month ?? item.category ?? item.name)
          )
        );
        const series = Array.from(
          new Set(this.data.map((item) => item.team ?? 'Série'))
        );

        const categoryIndexMap = new Map(
          categories.map((cat, idx) => [cat, idx])
        );
        const seriesIndexMap = new Map(series.map((ser, idx) => [ser, idx]));

        const heatmapData: number[][] = [];

        this.data.forEach((item: any) => {
          const categoryKey = item.month ?? item.category ?? item.name;
          const seriesKey = item.team ?? 'Série';

          const x = categoryIndexMap.get(categoryKey);
          const y = seriesIndexMap.get(seriesKey);
          const value = typeof item.value === 'number' ? item.value : 0;

          if (x !== undefined && y !== undefined) {
            heatmapData.push([x, y, value]);
          }
        });

        this.debug &&
          console.log('Données heatmap formatées:', {
            categories,
            series,
            data: heatmapData,
          });

        mergeDeep(this._options, {
          xAxis: {
            categories: categories,
            title: { text: this._chartConfig.xtitle },
          },
          yAxis: {
            categories: series,
            title: { text: this._chartConfig.ytitle },
          },
          series: [
            {
              type: 'heatmap',
              name: this._chartConfig.title ?? 'Données',
              data: heatmapData,
              dataLabels: {
                enabled: true,
                color: '#000000',
              },
            },
          ],
        });
      }

      if (!this.chart && !this._shouldRedraw) {
        this._shouldRedraw = true;
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données heatmap:', error);
      mergeDeep(this._options, { series: [] });
    }
  }

  private cleanSpecialChartConfigs(): void {
    if (this._options.xAxis) {
      delete this._options.xAxis.categories;
    }
    if (this._options.yAxis) {
      delete this._options.yAxis.categories;
    }

    if (this._options.colorAxis) {
      delete this._options.colorAxis;
    }

    if (this._options.plotOptions) {
      delete this._options.plotOptions.treemap;
      delete this._options.plotOptions.heatmap;
    }

    this.debug && console.log('Configurations spéciales nettoyées');
  }
}
