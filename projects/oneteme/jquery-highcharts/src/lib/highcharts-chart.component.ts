import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, Output, EventEmitter, NgZone, AfterViewInit, OnDestroy, ChangeDetectionStrategy,
} from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType, buildChart, Coordinate2D, CommonChart, mergeDeep, buildSingleSerieChart } from '@oneteme/jquery-core';

import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Funnel from 'highcharts/modules/funnel';
import Treemap from 'highcharts/modules/treemap';
import Exporting from 'highcharts/modules/exporting';
import * as Highcharts from 'highcharts';

// Initialisation des modules Highcharts
more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Funnel(Highcharts);
Treemap(Highcharts);
Exporting(Highcharts);


@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'highcharts-chart',
  template: `<div
    class="chart-container"
    style="width: 100%; height: 100%;"
  ></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighchartsComponent<X extends XaxisType, Y extends YaxisType>
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  protected _charts: {
    [key: string]: { possibleType: ChartType[] };
  } = {
    pie: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    donut: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    polar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radial: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    line: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    area: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    spline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    areaspline: { possibleType: ['line', 'area', 'spline', 'areaspline'] },
    bar: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    column: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    heatmap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    treemap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    funnel: { possibleType: ['funnel', 'pyramid'] },
    pyramid: { possibleType: ['funnel', 'pyramid'] },
    rangeArea: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn']},
    rangeBar: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
    rangeColumn: { possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'] },
  };

  private chart: Highcharts.Chart;
  private chartOptions: Highcharts.Options;
  private updateFlag = false;
  private readonly oneToOneFlag = true;
  private readonly runOutsideAngularFlag = true;
  private commonChart: CommonChart<X, Y | Coordinate2D>;

  @Input({ alias: 'type', required: true }) _type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];
  @Input() isLoading: boolean = false;
  @Input() debug: boolean = false;
  @Output() chartInstance = new EventEmitter<Highcharts.Chart>();

  constructor(private readonly el: ElementRef, private readonly zone: NgZone) {}

  ngOnInit(): void {
    if (this.debug) {
      console.log('[HIGHCHARTS] ngOnInit', {
        type: this._type,
        config: this.config,
      });
    }
    this.initOptions();
  }

  ngAfterViewInit(): void {
    if (this.chartOptions) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log('[HIGHCHARTS] ngOnChanges', changes);
    }

    // Si le type de graphique change
    if (changes['_type'] && !changes['_type'].firstChange) {
      this.updateChartType(changes['_type'].currentValue);
      this.updateFlag = true;
    }

    if (
      (changes['data'] || changes['config']) &&
      !changes['data']?.firstChange &&
      !changes['config']?.firstChange
    ) {
      this.updateData();
      this.updateFlag = true;
    }

    if (changes['isLoading'] && this.chart) {
      this.toggleLoading(this.isLoading);
    }

    // Mise à jour du graphique si nécessaire
    if (this.chart && this.updateFlag) {
      this.updateChart();
      this.updateFlag = false;
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
      this.chartInstance.emit(this.chart);
    }
  }

  // Initialise les options du graphique
  private initOptions(): void {
    this.chartOptions = this.getBaseOptions();
    this.updateData();

    if (this.chart) {
      this.updateChart();
    }
  }

  // Crée une nouvelle instance du graphique Highcharts
  private createChart(): void {
    if (!this.chartOptions) {
      console.warn('[HIGHCHARTS] Options de graphique non définies');
      return;
    }

    try {
      if (!this.chartOptions.chart) this.chartOptions.chart = {};

      if (this.runOutsideAngularFlag) {
        this.zone.runOutsideAngular(() => {
          this.chart = Highcharts.chart(
            this.el.nativeElement.querySelector('.chart-container'),
            this.chartOptions
          );
          this.chartInstance.emit(this.chart);
          this.toggleLoading(this.isLoading);
        });
      } else {
        this.chart = Highcharts.chart(
          this.el.nativeElement.querySelector('.chart-container'),
          this.chartOptions
        );
        this.chartInstance.emit(this.chart);
        this.toggleLoading(this.isLoading);
      }

      if (this.debug) {
        console.log('[HIGHCHARTS] Graphique créé avec succès', this.chart);
      }
    } catch (error) {
      console.error('[HIGHCHARTS] Erreur lors de la création du graphique:', error);
    }
  }

  // Met à jour le graphique existant avec les nouvelles options
  private updateChart(): void {
    if (!this.chart) return;

    if (this.runOutsideAngularFlag) {
      this.zone.runOutsideAngular(() => {
        this.chart.update(this.chartOptions, true, this.oneToOneFlag);
      });
    } else {
      this.chart.update(this.chartOptions, true, this.oneToOneFlag);
    }
  }

  // Affiche ou masque l'indicateur de chargement
  private toggleLoading(show: boolean): void {
    if (!this.chart) return;

    if (show) {
      this.chart.showLoading('Chargement des données...');
    } else {
      this.chart.hideLoading();
    }
  }

  // Met à jour la configuration du graphique
  private updateConfig(): void {
    // Re-initialiser les options du graphique lors des changements de configuration
    this.chartOptions = mergeDeep(
      this.chartOptions || {},
      this.getBaseOptions()
    );
  }

  // Met à jour les données du graphique en utilisant jquery-core
  private updateData(): void {
    if (!this.data || !this.config) return;

    try {
      // S'assurer que config.series est défini
      if (!this.config.series || !Array.isArray(this.config.series) || this.config.series.length === 0) {
        console.warn('[HIGHCHARTS] Configuration des séries manquante ou invalide');
        return;
      }

      // Déterminer si nous utilisons un graphique simple ou complexe
      if (this.isSimpleChartType(this._type)) {
        // Pour les graphiques simples
        this.commonChart = buildSingleSerieChart(
          this.data,
          { ...this.config, continue: false },
          null
        );
      } else {
        // Pour les graphiques complexes
        this.commonChart = buildChart(
          this.data,
          { ...this.config, continue: this.determineIfContinuous() },
          null
        );
      }

      // Mise à jour des séries dans les options Highcharts
      this.updateSeriesData();

      // Mise à jour des options spécifiques au type de graphique
      this.updateTypeSpecificOptions();

      if (this.debug) {
        console.log('[HIGHCHARTS] Données mises à jour', this.commonChart);
      }
    } catch (error) {
      console.error('[HIGHCHARTS] Erreur lors de la mise à jour des données:', error);
    }
  }

  // Met à jour le type de graphique
  private updateChartType(newType: ChartType): void {
    this._type = newType;

    // Mise à jour des options spécifiques au type
    if (this.chartOptions?.chart) {
      this.chartOptions.chart.type = this.mapChartType(this._type);
    }

    this.updateTypeSpecificOptions();
  }

  // Vérifie si un type de graphique est de type simple
  private isSimpleChartType(type: ChartType): boolean {
    return ['pie','donut','funnel','pyramid','polar','radar','radial'].includes(type);
  }

  // Détermine si les données doivent être traitées comme continues
  private determineIfContinuous(): boolean {
    return ['line', 'area', 'spline', 'areaspline'].includes(this._type);
  }

  // Génère les options de base pour le graphique
  private getBaseOptions(): Highcharts.Options {
    if (!this.config) {
      this.config = {};
    }

    return {
      chart: {
        type: this.mapChartType(this._type),
      },
      title: {
        text: this.config.title || undefined,
      },
      subtitle: {
        text: this.config.subtitle || undefined,
      },
      credits: {
        enabled: false,
      },
      accessibility: {
        enabled: false,
      },
      exporting: {
        enabled: this.config.showToolbar ?? false
      },
      plotOptions: {
        series: {
          stacking: this.config.stacked ? 'normal' : undefined,
          dataLabels: {
            enabled: false,
          },
          events: {
          },
        },
      },
      xAxis: {
        title: {
          text: this.config.xtitle || undefined,
        },
        type: 'category',
      },
      yAxis: {
        title: {
          text: this.config.ytitle || undefined,
        },
      },
      series: [],
    };
  }

  /**
   * Mappe les types de graphiques ChartType vers les types Highcharts
   */
  private mapChartType(chartType: ChartType): string {
    const typeMapping = {
      pie: 'pie',
      donut: 'pie', // Highcharts utilise pie avec innerSize
      polar: 'column', // Sera transformé en polarArea
      radar: 'line', // Sera transformé en radar
      radial: 'column', // Sera transformé en radialBar
      line: 'line',
      area: 'area',
      spline: 'spline',
      areaspline: 'areaspline',
      bar: 'bar',
      column: 'column',
      heatmap: 'heatmap',
      treemap: 'treemap',
      funnel: 'funnel',
      pyramid: 'funnel', // Sera inversé
      rangeArea: 'arearange',
      rangeBar: 'columnrange',
      rangeColumn: 'columnrange',
    };

    return typeMapping[chartType] ?? 'line';
  }

  /**
   * Met à jour les séries de données dans les options du graphique
   */
  private updateSeriesData(): void {
    if (!this.commonChart || !this.chartOptions) return;

    try {
      if (this.isSimpleChartType(this._type)) {
        // Format pour les graphiques simples comme pie, donut
        const seriesData =
          this.commonChart.series[0]?.data.map((point, index) => {
            const category = this.commonChart.categories?.[index] || '';
            return {
              name: String(category),
              y: typeof point === 'number' ? point : null,
            };
          }) || [];

        this.chartOptions.series = [
          {
            name:
              this.commonChart.series[0]?.name ||
              this.config.ytitle ||
              'Valeur',
            data: seriesData,
            color: this.commonChart.series[0]?.color,
          },
        ] as any;
      } else {
        // Format pour les graphiques complexes
        const series = this.commonChart.series.map((series) => {
          let seriesData;

          if (this.determineIfContinuous()) {
            // Pour les graphiques continus (x, y)
            seriesData = series.data.map((point) => {
              if (
                typeof point === 'object' &&
                point !== null &&
                'x' in point &&
                'y' in point
              ) {
                return { x: (point as any).x, y: (point as any).y };
              }
              return point;
            });
          } else {
            // Pour les graphiques avec catégories
            seriesData = series.data;
          }

          return {
            name: series.name || '',
            data: seriesData,
            color: series.color,
            stack: series.stack,
          };
        });

        this.chartOptions.series = series as any;

        // Ajouter les catégories pour les graphiques non-continus
        if (
          !this.determineIfContinuous() &&
          this.commonChart.categories?.length
        ) {
          if (!this.chartOptions.xAxis) {
            this.chartOptions.xAxis = {};
          }

          if (Array.isArray(this.chartOptions.xAxis)) {
            this.chartOptions.xAxis[0].categories =
              this.commonChart.categories.map((category) => String(category));
          } else {
            this.chartOptions.xAxis.categories =
              this.commonChart.categories.map((category) => String(category));
          }
        }
      }

      // Fusionner avec les options personnalisées de l'utilisateur
      if (this.config.options) {
        this.chartOptions = mergeDeep(this.chartOptions, this.config.options);
      }
    } catch (error) {
      console.error(
        '[HIGHCHARTS] Erreur lors de la mise à jour des séries:',
        error
      );
    }
  }

  /**
   * Met à jour les options spécifiques au type de graphique sélectionné
   */
  private updateTypeSpecificOptions(): void {
    if (!this.chartOptions?.chart) return;

    this.chartOptions.chart.type = this.mapChartType(this._type);

    // Réinitialiser certaines options qui pourraient persister
    if (this.chartOptions.chart.polar) this.chartOptions.chart.polar = false;
    if (this.chartOptions.chart.inverted)
      this.chartOptions.chart.inverted = false;
    if (this.chartOptions.pane) delete this.chartOptions.pane;

    // Configurer les options spécifiques au type
    switch (this._type) {
      case 'donut':
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.pie)
          this.chartOptions.plotOptions.pie = {};
        this.chartOptions.plotOptions.pie.innerSize = '50%';
        break;

      case 'polar':
        this.chartOptions.chart.polar = true;
        break;

      case 'radar':
        this.chartOptions.chart.polar = true;
        this.chartOptions.pane = {
          size: '80%',
          startAngle: 0,
          endAngle: 360,
        };
        break;

      case 'bar':
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.bar)
          this.chartOptions.plotOptions.bar = {};
        // Barres horizontales
        this.chartOptions.chart.inverted = true;
        break;

      case 'pyramid':
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.funnel)
          this.chartOptions.plotOptions.funnel = {};
        this.chartOptions.plotOptions.funnel.reversed = true;
        break;

      case 'rangeBar':
      case 'rangeColumn':
        // Configuration spécifique pour les graphiques de type range
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.columnrange)
          this.chartOptions.plotOptions.columnrange = {};
        this.chartOptions.chart.inverted = this._type === 'rangeBar';
        break;

      case 'spline':
      case 'areaspline':
        // Configuration spécifique pour les graphiques de type spline
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.spline)
          this.chartOptions.plotOptions.spline = {};
        if (!this.chartOptions.plotOptions.areaspline)
          this.chartOptions.plotOptions.areaspline = {};
        break;
    }
  }
}
