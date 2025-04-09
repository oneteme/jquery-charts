import { Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, signal, SimpleChanges } from '@angular/core';
import { buildChart, ChartProvider, ChartView, CommonChart, naturalFieldComparator, XaxisType, YaxisType } from '@oneteme/jquery-core';
import * as Highcharts from 'highcharts';
import { asapScheduler } from 'rxjs';
import { ChartCustomEvent, configureChartTypeOptions, convertToHighchartsSeries, getType, initCommonChartOptions, updateCommonOptions } from './utils';

@Directive({
  standalone: true,
  selector: '[bar-chart]',
})
export class BarChartDirective<X extends XaxisType>
  implements ChartView<X, number>, OnChanges, OnDestroy
{
  private readonly el: ElementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly chartInstance = signal<Highcharts.Chart | null>(null);
  private _chartConfig: ChartProvider<X, number>;
  private _options: Highcharts.Options;
  private _canPivot: boolean = true;

  @Input() debug: boolean;
  @Input({ required: true }) type: 'bar' | 'column' | 'funnel' | 'pyramid';
  @Input({ required: true }) data: any[];
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();

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

  @Input()
  set canPivot(canPivot: boolean) {
    this._canPivot = canPivot;
  }

  get canPivot(): boolean {
    return this._canPivot;
  }

  @Input()
  set config(config: ChartProvider<X, number>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);
    this.configureTypeSpecificOptions();
  }

  constructor() {
    this._options = initCommonChartOptions(this.el, this.customEvent, this.ngZone, 'bar');
    this.configureTypeSpecificOptions();
  }

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
    if (changes['type']) this.updateType();

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

  private updateType() {
    configureChartTypeOptions(this._options, this.type);
    (this._options as any).shouldRedraw = true;
  }

  private configureTypeSpecificOptions() {
    configureChartTypeOptions(this._options, this.type);
  }

  private updateData() {
    let sortedData = [...this.data];
    if (this.type == 'funnel') {
      sortedData = sortedData.sort(
        naturalFieldComparator('asc', this._chartConfig.series[0].data.y)
      );
    } else if (this.type == 'pyramid') {
      sortedData = sortedData.sort(
        naturalFieldComparator('desc', this._chartConfig.series[0].data.y)
      );
    }

    const commonChart = buildChart(sortedData, {
      ...this._chartConfig,
      pivot: !this.canPivot ? false : this._chartConfig.pivot,
    });

    // Conversion des séries au format Highcharts
    this._options.series = convertToHighchartsSeries(commonChart as CommonChart<X, YaxisType>);

    // Mise à jour des catégories si nécessaire
    if (commonChart.categories?.length) {
      if (!this._options.xAxis) this._options.xAxis = {};
      (this._options.xAxis as any).categories = commonChart.categories;
    }

    // Mise à jour du type d'axe X
    const axisType = getType(commonChart);
    if (!this._options.xAxis) this._options.xAxis = {};
    if ((this._options.xAxis as any).type !== axisType) {
      (this._options.xAxis as any).type = axisType;
      (this._options as any).shouldRedraw = true;
    }
  }
}
