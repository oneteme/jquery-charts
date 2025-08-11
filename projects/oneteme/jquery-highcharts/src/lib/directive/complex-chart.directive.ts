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
    const wasScatterBubble = previousType === 'scatter' || previousType === 'bubble';
    const isScatterBubble = this.type === 'scatter' || this.type === 'bubble';

    if (wasSpecialType !== isSpecialType || 
        (wasSpecialType && isSpecialType && previousType !== this.type) ||
        (wasScatterBubble && previousType !== this.type) ||
        (isScatterBubble && previousType !== this.type)) {
      this.debug && console.log('Transition critique détectée, nettoyage nécessaire');
      this._shouldRedraw = true;

      if (wasSpecialType && !isSpecialType) {
        this.cleanSpecialChartConfigs();
      } else if ((wasScatterBubble || isScatterBubble) && previousType !== this.type) {
        this.cleanScatterBubbleConfigs();
      }
    }

    if (this._options.chart?.type !== this.type) {
      mergeDeep(this._options, {
        chart: { type: this.type },
      });
      this._shouldRedraw = true;
    }

    if (this.type === 'treemap' || this.type === 'heatmap' || this.type === 'scatter' || this.type === 'bubble') {
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
        tooltip: (this.type === 'treemap' || this.type === 'heatmap' || this.type === 'scatter' || this.type === 'bubble') ? {} : {
          shared: true,
        },
      },
      this._chartConfig.options ?? {}
    );

    if (this.type === 'treemap' || this.type === 'heatmap' || this.type === 'scatter' || this.type === 'bubble') {
      if (this.type === 'scatter' || this.type === 'bubble') {
        this.cleanScatterBubbleConfigs();
      }
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

      if (this.type === 'scatter') {
        this.handleScatterData();
        return;
      }

      if (this.type === 'bubble') {
        this.handleBubbleData();
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

        const treemapPoints = this.data.map((item: any, index: number) => {
          const pointName = item.category || item.month || item.name || `Item ${index + 1}`;
          const pointValue = Math.abs(typeof item.value === 'number' ? item.value : (item.y || 0));

          return {
            name: pointName,
            value: pointValue,
            colorValue: item.value || item.y || pointValue,
          };
        });

        this.debug && console.log('Données treemap adaptées:', treemapPoints);

        mergeDeep(this._options, {
          series: [
            {
              type: 'treemap',
              name: this._chartConfig.title ?? 'Données',
              data: treemapPoints,
              layoutAlgorithm: 'squarified',
            },
          ],
        });
      } else {
        const treemapPoints = this.data.map((item: any, index: number) => ({
          name: item.month ?? item.category ?? item.name ?? `Item ${index + 1}`,
          value: Math.abs(item.value),
          colorValue: item.value,
          team: item.team ?? 'Groupe principal',
        }));

        const groupedPoints = this.groupTreemapData(treemapPoints);

        this.debug && console.log('Données treemap formatées:', groupedPoints);

        mergeDeep(this._options, {
          series: [
            {
              type: 'treemap',
              name: this._chartConfig.title ?? 'Données',
              data: groupedPoints,
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
    const serieGroups = new Map();

    data.forEach((item) => {
      const groupKey = item.team ?? 'Principal';
      if (!serieGroups.has(groupKey)) {
        serieGroups.set(groupKey, []);
      }
      serieGroups.get(groupKey).push(item);
    });

    const result: any[] = [];
    let parentId = 0;

    serieGroups.forEach((items, groupName) => {
      const parentItem = {
        id: `parent-${parentId}`,
        name: groupName,
        value: items.reduce((sum: number, item: any) => sum + item.value, 0),
      };

      result.push(parentItem);

      items.forEach((item: any) => {
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

        const xCategories = this.data.map((item, index) =>
          item.category || item.month || item.name || `Item ${index + 1}`
        );

        const heatmapPoints: number[][] = this.data.map((item: any, index: number) => [index, 0, typeof item.value === 'number' ? item.value : (item.y || 0)]);

        this.debug && console.log('Données heatmap adaptées:', { categories: xCategories, data: heatmapPoints });

        mergeDeep(this._options, {
          xAxis: {
            categories: xCategories,
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
              data: heatmapPoints,
              dataLabels: {
                enabled: true,
                color: '#000000',
              },
            },
          ],
        });
      } else {
        const xCategories = Array.from(
          new Set(
            this.data.map((item) => item.month ?? item.category ?? item.name)
          )
        );
        const yCategories = Array.from(
          new Set(this.data.map((item) => item.team ?? 'Série'))
        );

        const xIndexMap = new Map(
          xCategories.map((cat, idx) => [cat, idx])
        );
        const yIndexMap = new Map(yCategories.map((ser, idx) => [ser, idx]));

        const heatmapPoints: number[][] = [];

        this.data.forEach((item: any) => {
          const categoryKey = item.month ?? item.category ?? item.name;
          const serieKey = item.team ?? 'Série';

          const x = xIndexMap.get(categoryKey);
          const y = yIndexMap.get(serieKey);
          const value = typeof item.value === 'number' ? item.value : 0;

          if (x !== undefined && y !== undefined) {
            heatmapPoints.push([x, y, value]);
          }
        });

        this.debug &&
          console.log('Données heatmap formatées:', {
            categories: xCategories,
            series: yCategories,
            data: heatmapPoints,
          });

        mergeDeep(this._options, {
          xAxis: {
            categories: xCategories,
            title: { text: this._chartConfig.xtitle },
          },
          yAxis: {
            categories: yCategories,
            title: { text: this._chartConfig.ytitle },
          },
          series: [
            {
              type: 'heatmap',
              name: this._chartConfig.title ?? 'Données',
              data: heatmapPoints,
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
      delete this._options.plotOptions.scatter;
      delete this._options.plotOptions.bubble;
    }

    if (this._options.tooltip) {
      delete this._options.tooltip.headerFormat;
      delete this._options.tooltip.pointFormat;
      delete this._options.tooltip.shared;
      delete this._options.tooltip.followPointer;
    }

    this.debug && console.log('Configurations spéciales nettoyées');
  }

  private cleanScatterBubbleConfigs(): void {
    if (this._options.plotOptions) {
      delete this._options.plotOptions.scatter;
      delete this._options.plotOptions.bubble;
    }

    if (this._options.tooltip) {
      delete this._options.tooltip.headerFormat;
      delete this._options.tooltip.pointFormat;
      delete this._options.tooltip.shared;
      delete this._options.tooltip.followPointer;
    }

    this.debug && console.log('Configurations scatter/bubble nettoyées');
  }

  private handleScatterData(): void {
    try {
      this.debug && console.log('Traitement des données scatter:', this.data);

      const serieNames = [...new Set(this.data.map(item => item.team))].filter(Boolean);
      const hasMultipleSeries = serieNames.length > 1;

      this.debug && console.log('Séries détectées:', serieNames, 'Multiple:', hasMultipleSeries);

      let series: any[] = [];

      if (hasMultipleSeries) {
        serieNames.forEach((serieName) => {
          const serieData = this.data.filter(item => item.team === serieName);
          const scatterPoints = serieData.map((item: any, index: number) => {
            const xLabel = item.month || item.category || item.name || `Point ${index + 1}`;
            
            let yValue = 0;
            if (typeof item.value === 'number') {
              yValue = item.value;
            } else if (typeof item.y === 'number') {
              yValue = item.y;
            }

            return {
              name: `${xLabel} - ${serieName}`,
              y: yValue,
              custom: {
                month: xLabel
              }
            };
          });

          series.push({
            type: 'scatter',
            name: serieName,
            data: scatterPoints
          });
        });

        const xCategories = [...new Set(this.data.map(item => item.month || item.category || item.name))];
        
        mergeDeep(this._options, {
          xAxis: {
            categories: xCategories,
            title: { text: this._chartConfig.xtitle || 'Catégories' }
          },
          yAxis: {
            type: 'linear', 
            title: { text: this._chartConfig.ytitle || 'Valeurs' }
          },
          series: series
        });
      } else {
        const scatterPoints = this.data.map((item: any, index: number) => {
          const xLabel = item.month || item.category || item.name || `Point ${index + 1}`;
          
          let yValue = 0;
          if (typeof item.value === 'number') {
            yValue = item.value;
          } else if (typeof item.y === 'number') {
            yValue = item.y;
          }

          return {
            name: xLabel,
            y: yValue,
            custom: {
              month: xLabel
            }
          };
        });

        const xCategories = this.data.map(item => item.month || item.category || item.name || `Point ${this.data.indexOf(item) + 1}`);

        mergeDeep(this._options, {
          xAxis: {
            categories: xCategories,
            title: { text: this._chartConfig.xtitle || 'Catégories' }
          },
          yAxis: {
            type: 'linear', 
            title: { text: this._chartConfig.ytitle || 'Valeurs' }
          },
          series: [{
            type: 'scatter',
            name: this._chartConfig.title || 'Données',
            data: scatterPoints
          }]
        });
      }

      this.debug && console.log('Série scatter configurée:', series.length > 0 ? series : this._options.series);

      if (!this.chart && !this._shouldRedraw) {
        this.debug && console.log('Données scatter valides détectées, force la création du graphique');
        this._shouldRedraw = true;
      }

    } catch (error) {
      console.error('Erreur lors du traitement des données scatter:', error);
      mergeDeep(this._options, { series: [] });
    }
  }

  private handleBubbleData(): void {
    try {
      this.debug && console.log('Traitement des données bubble:', this.data);

      const serieNames = [...new Set(this.data.map(item => item.team))].filter(Boolean);
      const hasMultipleSeries = serieNames.length > 1;

      this.debug && console.log('Séries détectées pour bubble:', serieNames, 'Multiple:', hasMultipleSeries);

      const allValues = this.data.map(item => Math.abs(item.value || item.y || 0));
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const valueRange = maxValue - minValue || 1;

      const hasCustomSizes = this.data.some(item => item.z !== undefined || item.size !== undefined);

      let series: any[] = [];

      if (hasMultipleSeries) {
        serieNames.forEach((serieName) => {
          const serieData = this.data.filter(item => item.team === serieName);
          const bubblePoints = serieData.map((item: any, index: number) => {
            const xLabel = item.month || item.category || item.name || `Point ${index + 1}`;
            
            let yValue = 0;
            if (typeof item.value === 'number') {
              yValue = item.value;
            } else if (typeof item.y === 'number') {
              yValue = item.y;
            }
            
            let zValue = item.z || item.size;
            if (zValue === undefined) {
              if (hasCustomSizes) {
                const normalizedValue = ((Math.abs(yValue) - minValue) / valueRange) || 0;
                zValue = Math.max(10, Math.min(50, 10 + normalizedValue * 40));
              } else {
                zValue = 15;
              }
            }

            return {
              name: `${xLabel}`,
              y: yValue,
              z: Math.round(zValue * 100) / 100,
              custom: {
                month: xLabel,
                serie: serieName,
                value: yValue,
                size: hasCustomSizes ? Math.round(zValue * 100) / 100 : null
              }
            };
          });

          series.push({
            type: 'bubble',
            name: serieName,
            data: bubblePoints
          });
        });

        const xCategories = [...new Set(this.data.map(item => item.month || item.category || item.name))];
        
        const tooltipFormat = hasCustomSizes 
          ? '{point.custom.month}: <b>{point.y}</b><br/>Taille: <b>{point.custom.size}</b>'
          : '{point.custom.month}: <b>{point.y}</b>';

        mergeDeep(this._options, {
          xAxis: {
            categories: xCategories,
            title: { text: this._chartConfig.xtitle || 'Catégories' }
          },
          yAxis: {
            title: { text: this._chartConfig.ytitle || 'Valeurs' }
          },
          tooltip: {
            shared: false,
            split: false,
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: tooltipFormat
          },
          plotOptions: {
            bubble: {
              stickyTracking: false,
              findNearestPointBy: 'xy'
            }
          },
          series: series
        });
      } else {
        const bubblePoints = this.data.map((item: any, index: number) => {
          const xLabel = item.month || item.category || item.name || `Point ${index + 1}`;
          
          let yValue = 0;
          if (typeof item.value === 'number') {
            yValue = item.value;
          } else if (typeof item.y === 'number') {
            yValue = item.y;
          }
          
          let zValue = item.z || item.size;
          if (zValue === undefined) {
            if (hasCustomSizes) {
              const normalizedValue = ((Math.abs(yValue) - minValue) / valueRange) || 0;
              zValue = Math.max(10, Math.min(50, 10 + normalizedValue * 40));
            } else {
              zValue = 15;
            }
          }

          return {
            name: xLabel,
            y: yValue,
            z: Math.round(zValue * 100) / 100,
            custom: {
              month: xLabel,
              value: yValue,
              size: hasCustomSizes ? Math.round(zValue * 100) / 100 : null
            }
          };
        });

        const xCategories = this.data.map(item => item.month || item.category || item.name || `Point ${this.data.indexOf(item) + 1}`);

        const tooltipFormat = hasCustomSizes 
          ? '{point.custom.month}: <b>{point.y}</b><br/>Taille: <b>{point.custom.size}</b>'
          : '{point.custom.month}: <b>{point.y}</b>';

        mergeDeep(this._options, {
          xAxis: {
            categories: xCategories,
            title: { text: this._chartConfig.xtitle || 'Catégories' }
          },
          yAxis: {
            title: { text: this._chartConfig.ytitle || 'Valeurs' }
          },
          tooltip: {
            shared: false,
            split: false,
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: tooltipFormat
          },
          plotOptions: {
            bubble: {
              stickyTracking: false,
              findNearestPointBy: 'xy'
            }
          },
          series: [{
            type: 'bubble',
            name: this._chartConfig.title || 'Données',
            data: bubblePoints,
            minSize: 8,
            maxSize: 25,
            stickyTracking: false
          }]
        });
      }

      this.debug && console.log('Série bubble configurée:', series.length > 0 ? series : this._options.series);
      this.debug && console.log('Plage des valeurs:', { minValue, maxValue, valueRange });

      if (!this.chart && !this._shouldRedraw) {
        this.debug && console.log('Données bubble valides détectées, force la création du graphique');
        this._shouldRedraw = true;
      }

    } catch (error) {
      console.error('Erreur lors du traitement des données bubble:', error);
      mergeDeep(this._options, { series: [] });
    }
  }
}
