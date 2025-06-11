import { Directive, ElementRef, Input, NgZone, inject } from '@angular/core';
import { XaxisType, YaxisType, buildChart, mergeDeep } from '@oneteme/jquery-core';
import { BaseChartDirective } from './base-chart.directive';
import { getType } from './utils/chart-utils';
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
    if (this.debug) console.log('Mise à jour du type de graphique:', this.type);

    if (this._options.chart?.type !== this.type) {
      mergeDeep(this._options, {
        chart: { type: this.type },
      });
      this._shouldRedraw = true;
    }

    // Configuration spécifique pour treemap et heatmap
    if (this.type === 'treemap' || this.type === 'heatmap') {
      configureComplexGraphOptions(this._options, this.type, this.debug);
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

    // Application des configurations spéciales après merge
    if (this.type === 'treemap' || this.type === 'heatmap') {
      configureComplexGraphOptions(this._options, this.type, this.debug);
    }
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
      // Gestion spéciale pour treemap et heatmap
      if (this.type === 'treemap') {
        this.handleTreemapData();
        return;
      }

      if (this.type === 'heatmap') {
        this.handleHeatmapData();
        return;
      }

      // Gestion normale pour les autres types
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

  private handleTreemapData(): void {
    try {
      if (this.debug) console.log('Traitement des données treemap:', this.data);

      // Pour treemap, transformer les données selon le format Highcharts
      const treemapData = this.data.map((item: any, index: number) => ({
        name: item.month ?? item.category ?? item.name ?? `Item ${index + 1}`,
        value: typeof item.value === 'number' ? Math.abs(item.value) : 0, // Treemap nécessite des valeurs positives
        colorValue: typeof item.value === 'number' ? item.value : 0,
        team: item.team ?? 'Groupe principal'
      }));

      // Grouper par équipe/catégorie si disponible
      const groupedData = this.groupTreemapData(treemapData);

      if (this.debug) console.log('Données treemap formatées:', groupedData);

      mergeDeep(this._options, {
        series: [{
          type: 'treemap',
          name: this._chartConfig.title ?? 'Données',
          data: groupedData,
          layoutAlgorithm: 'squarified'
        }]
      });

      // Forcer la création si nécessaire
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

    data.forEach(item => {
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
        value: items.reduce((sum: number, item: any) => sum + item.value, 0)
      };

      result.push(parentItem);

      items.forEach((item: any, index: number) => {
        result.push({
          name: item.name,
          parent: parentItem.id,
          value: item.value,
          colorValue: item.colorValue
        });
      });

      parentId++;
    });

    return result;
  }

  private handleHeatmapData(): void {
    try {
      if (this.debug) console.log('Traitement des données heatmap:', this.data);

      // Pour heatmap, créer une matrice de données
      const categories = [...new Set(this.data.map((item: any) => item.month ?? item.category ?? item.name))];
      const series = [...new Set(this.data.map((item: any) => item.team ?? 'Série'))];

      const heatmapData: any[] = [];

      this.data.forEach((item: any) => {
        const x = categories.indexOf(item.month ?? item.category ?? item.name);
        const y = series.indexOf(item.team ?? 'Série');
        const value = typeof item.value === 'number' ? item.value : 0;

        if (x >= 0 && y >= 0) {
          heatmapData.push([x, y, value]);
        }
      });

      if (this.debug) console.log('Données heatmap formatées:', { categories, series, data: heatmapData });

      mergeDeep(this._options, {
        xAxis: {
          categories: categories,
          title: { text: this._chartConfig.xtitle }
        },
        yAxis: {
          categories: series,
          title: { text: this._chartConfig.ytitle }
        },
        series: [{
          type: 'heatmap',
          name: this._chartConfig.title ?? 'Données',
          data: heatmapData,
          dataLabels: {
            enabled: true,
            color: '#000000'
          }
        }]
      });

      // Forcer la création si nécessaire
      if (!this.chart && !this._shouldRedraw) {
        this._shouldRedraw = true;
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données heatmap:', error);
      mergeDeep(this._options, { series: [] });
    }
  }
}
