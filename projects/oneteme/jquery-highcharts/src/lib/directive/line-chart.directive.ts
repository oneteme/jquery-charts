import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, CommonChart, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { asapScheduler } from 'rxjs';
import { ChartCustomEvent, configureChartTypeOptions, convertToHighchartsSeries, getType, initCommonChartOptions, updateCommonOptions } from './utils';

@Directive({
  standalone: true,
  selector: '[line-chart]',
})
export class LineChartDirective<X extends XaxisType, Y extends YaxisType>
  implements ChartView<X, Y>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly chartInstance = signal<Highcharts.Chart | null>(null);
  private _chartConfig: ChartProvider<X, Y>;
  private _options: Highcharts.Options;

  @Input() debug: boolean;
  @Input({ required: true }) data: any[];
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();

  /**
   * Setter pour l'état de chargement
   */
  @Input()
  set isLoading(isLoading: boolean) {
    if (this.chartInstance()) {
      if (isLoading) {
        this.chartInstance().showLoading('Chargement des données...');
      } else {
        this.chartInstance().hideLoading();
      }
    }
  }

  /**
   * Setter pour la gestion du type de graphique
   */
  @Input()
  set type(type: 'line' | 'area') {
    if (!this._options.chart) this._options.chart = {};
    if ((this._options.chart as any).type !== type) {
      (this._options.chart as any).type = type;
      configureChartTypeOptions(this._options, type);
      (this._options as any).shouldRedraw = true;
    }
  }

  /**
   * Setter pour la configuration du graphique
   */
  @Input()
  set config(config: ChartProvider<X, Y>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);

    // Vérifier si sparkline est activé
    if (config.options?.chart?.sparkline?.enabled) {
      if (!this._options.xAxis) this._options.xAxis = {};
      (this._options.xAxis as any).visible = false;

      if (!this._options.yAxis) this._options.yAxis = {};
      (this._options.yAxis as any).visible = false;

      if (!this._options.legend) this._options.legend = {};
      this._options.legend.enabled = false;
    }
  }

  constructor() {
    this._options = initCommonChartOptions(this.el, this.customEvent, this.ngZone, 'line');
  }

  /**
   * Initialise le graphique Highcharts
   */
  init() {
    if (this.debug) {
      console.log('Initialisation du graphique Highcharts', { ...this._options });
    }

    this.ngZone.runOutsideAngular(() => {
      try {
        const chart = Highcharts.chart(
          this.el.nativeElement,
          { ...this._options },
          (chart) => {
            if (this.debug) {
              console.log('Graphique Highcharts initialisé', chart);
            }
          }
        );

        this.chartInstance.set(chart);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du graphique:", error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log(new Date().getMilliseconds(), 'Détection de changements', changes);
    }

    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => this.hydrate(changes));
    });
  }

  ngOnDestroy() {
    const chart = this.chartInstance();
    if (chart) {
      chart.destroy();
      this.chartInstance.set(null);
    }
  }

  private hydrate(changes: SimpleChanges): void {
    if (this.debug) console.log('Hydratation du graphique', { ...changes });

    const needsDataUpdate = changes['data'] || changes['config'] || changes['type'];
    const needsOptionsUpdate = Object.keys(changes).some(key => !['debug'].includes(key));

    if (needsDataUpdate && this.data && this._chartConfig) {
      this.updateData();
    }

    if (changes['isLoading'] && this.chartInstance()) {
      if (changes['isLoading'].currentValue) {
        this.chartInstance().showLoading('Chargement des données...');
      } else {
        this.chartInstance().hideLoading();
      }
    }

    // Si options doivent être réinitialisées complètement
    if ((this._options as any).shouldRedraw) {
      if (this.debug) console.log('Recréation complète du graphique nécessaire', changes);
      this.ngOnDestroy();
      this.init();
      delete (this._options as any).shouldRedraw;
    } else if (needsOptionsUpdate && this.chartInstance()) {
      if (this.debug) console.log('Mise à jour des options du graphique', changes);
      this.updateChartOptions();
    }
  }

  private updateData() {
    const commonChart = buildChart(
      this.data,
      { ...this._chartConfig, continue: true },
      null
    );

    // Mise à jour du type d'axe X
    const axisType = getType(commonChart);
    if (!this._options.xAxis) this._options.xAxis = {};
    if ((this._options.xAxis as any).type !== axisType) {
      (this._options.xAxis as any).type = axisType;
    }

    // Conversion des séries au format Highcharts
    this._options.series = convertToHighchartsSeries(commonChart as CommonChart<X, YaxisType>);
  }

  private updateChartOptions(): void {
    const chart = this.chartInstance();
    if (!chart) return;

    try {
      // Mise à jour des séries
      if (this._options.series && Array.isArray(this._options.series)) {
        while (chart.series.length > 0) {
          chart.series[0].remove(false);
        }

        this._options.series.forEach(series => {
          chart.addSeries(series as any, false);
        });
      }

      // Mise à jour des options générales
      chart.update(this._options, true);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des options:', error);
    }
  }
}
