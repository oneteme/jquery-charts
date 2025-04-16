import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  Output,
  EventEmitter,
  NgZone,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
  buildChart,
  Coordinate2D,
  CommonChart,
  mergeDeep,
} from '@oneteme/jquery-core';
import { ICONS } from '../assets/icons/icons';

import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Funnel from 'highcharts/modules/funnel';
import Treemap from 'highcharts/modules/treemap';
import Exporting from 'highcharts/modules/exporting';
import * as Highcharts from 'highcharts';

more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Funnel(Highcharts);
Treemap(Highcharts);
Exporting(Highcharts);


export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

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
    [key: string]: { possibleType: ChartType[]; canPivot?: boolean };
  } = {
    pie: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    donut: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    polar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radar: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    radial: { possibleType: ['pie', 'donut', 'polar', 'radar', 'radial'] },
    line: { possibleType: ['line', 'area'] },
    area: { possibleType: ['line', 'area'] },
    bar: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    column: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    heatmap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    treemap: { possibleType: ['bar', 'column', 'heatmap', 'treemap'] },
    funnel: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    pyramid: { possibleType: ['funnel', 'pyramid'], canPivot: false },
    rangeArea: {
      possibleType: ['rangeArea', 'rangeBar', 'rangeColumn'],
      canPivot: false,
    },
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
  @Output() customEvent: EventEmitter<ChartCustomEvent> = new EventEmitter();

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
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.debug) {
      console.log('[HIGHCHARTS] ngOnChanges', changes);
    }

    if (changes['_type'] && !changes['_type'].firstChange) {
      this.updateChartType(changes['_type'].currentValue);
    }

    // if (
    //   (changes['data'] || changes['config']) &&
    //   !changes['data']?.firstChange &&
    //   !changes['config']?.firstChange
    // ) {
    //   this.updateData();
    //   this.updateFlag = true;
    // }

    // if (changes['isLoading'] && this.chart) {
    //   this.toggleLoading(this.isLoading);
    // }

    // if (this.chart && this.updateFlag) {
    //   this.updateChart();
    //   this.updateFlag = false;
    // }

    if (this.config && this.data) {
      if (changes.type) {
        this.updateChartType(changes.type.currentValue);
      }
      if (changes.isLoading) {
        this.toggleLoading(this.isLoading);
      }
      if (changes.config) {
        this.updateConfig();
      }
      if (changes.config || changes.data) {
        this.updateData();
      }
      this.updateChart();
    }

  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private initOptions(): void {
    this.chartOptions = this.getBaseOptions();
    this.updateData();
  }

  private createChart(): void {
    if (this.runOutsideAngularFlag) {
      this.zone.runOutsideAngular(() => {
        this.chart = Highcharts.chart(
          this.el.nativeElement.querySelector('.chart-container'),
          this.chartOptions
        );
        this.chartInstance.emit(this.chart);

        if (this.isLoading) {
          this.toggleLoading(true);
        }
      });
    } else {
      this.chart = Highcharts.chart(
        this.el.nativeElement.querySelector('.chart-container'),
        this.chartOptions
      );
      this.chartInstance.emit(this.chart);

      if (this.isLoading) {
        this.toggleLoading(true);
      }
    }
  }

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

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private toggleLoading(show: boolean): void {
    if (!this.chart) return;

    if (show) {
      this.chart.showLoading('Chargement des données...');
    } else {
      this.chart.hideLoading();
    }
  }

  private updateConfig(): void {
    // Re-initialize chart options when config changes
    this.chartOptions = mergeDeep(this.chartOptions, this.getBaseOptions());
  }

  private updateData(): void {
    // Utiliser jquery-core pour transformer les données
    this.commonChart = buildChart(
      this.data,
      { ...this.config, continue: this.determineIfContinuous() },
      null
    );

    // Mise à jour des séries
    this.updateSeriesData();

    // Mise à jour des options spécifiques au type
    this.updateTypeSpecificOptions();
  }

  private updateChartType(newType: ChartType): void {
    this._type = newType;
    this.updateTypeSpecificOptions();

    if (this.chart) {
      this.updateChart();
    }
  }

  private determineIfContinuous(): boolean {
    // Déterminer si les données sont continues en fonction du type de graphique
    return ['line', 'area', 'bar', 'column'].includes(this._type);
  }

  private getBaseOptions(): Highcharts.Options {
    if (!this.config) {
      this.config = {};
    }

    return {
      chart: {
        type: this.mapChartType(this._type),
        styledMode: false,
        events: {
          load: function () {
            const toolbar = this.container.querySelector(
              '.highcharts-toolbar-custom'
            );
            if (toolbar) {
              (toolbar as HTMLElement).style.visibility = 'visible';
            }
          },
        },
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
        enabled: this.config.showToolbar ?? false,
        buttons: {
          contextButton: {
            menuItems: null,
            symbol: 'menu',
            symbolFill: '#666',
            symbolStroke: '#666',
            symbolStrokeWidth: 1,
            symbolSize: 14,
            symbolX: 12.5,
            symbolY: 10.5,
            align: 'right',
            buttonSpacing: 3,
            height: 22,
            verticalAlign: 'top',
            width: 24,
            text: 'Menu',
          },
        },
      },
      plotOptions: {
        series: {
          stacking: this.config.stacked ? 'normal' : undefined,
          dataLabels: {
            enabled: true,
            crop: false,
            overflow: 'allow',
            formatter: function () {
              return this.y.toLocaleString('fr-FR').replace(/,/g, ' ');
            },
            style: {
              fontWeight: 'bold',
              textOutline: '1px contrast',
            },
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

  private mapChartType(chartType: ChartType): string {
    const typeMapping = {
      pie: 'pie',
      donut: 'pie', // Highcharts utilise pie avec innerSize
      polar: 'column', // Sera transformé en polarArea
      radar: 'line', // Sera transformé en radar
      radial: 'column', // Sera transformé en radialBar
      line: 'line',
      area: 'area',
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

  private updateSeriesData(): void {
    if (!this.commonChart || !this.chartOptions) return;

    // Transformer les séries de commonChart en format Highcharts
    const series = this.commonChart.series.map((series) => {
      const seriesData = series.data.map((point) => {
        if (
          typeof point === 'object' &&
          point !== null &&
          'x' in point &&
          'y' in point
        ) {
          // Format [x, y] pour les graphiques continus
          return { x: (point as any).x, y: (point as any).y };
        }
        return point;
      });

      return {
        name: series.name || '',
        data: seriesData,
        color: series.color,
        stack: series.stack,
      };
    });

    this.chartOptions.series = series as any;

    // Ajouter les catégories si nécessaire
    if (this.commonChart.categories?.length) {
      if (!this.chartOptions.xAxis) {
        this.chartOptions.xAxis = {};
      }

      if (Array.isArray(this.chartOptions.xAxis)) {
        this.chartOptions.xAxis[0].categories = this.commonChart.categories.map(
          (category) => String(category)
        );
      } else {
        this.chartOptions.xAxis.categories = this.commonChart.categories.map(
          (category) => String(category)
        );
      }
    }
  }

  private updateTypeSpecificOptions(): void {
    if (!this.chartOptions?.chart) return;

    this.chartOptions.chart.type = this.mapChartType(this._type);

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
        if (!this.chartOptions.pane) this.chartOptions.pane = {};
        if (Array.isArray(this.chartOptions.pane)) {
          if (this.chartOptions.pane.length === 0) {
            this.chartOptions.pane.push({});
          }
          this.chartOptions.pane[0].startAngle = 0;
          this.chartOptions.pane[0].endAngle = 360;
        } else {
          this.chartOptions.pane.startAngle = 0;
          this.chartOptions.pane.endAngle = 360;
        }
        break;

      case 'bar':
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.bar)
          this.chartOptions.plotOptions.bar = {};
        // Set chart to inverted for horizontal bars
        this.chartOptions.chart.inverted = true;
        break;

      case 'pyramid':
        if (!this.chartOptions.plotOptions) this.chartOptions.plotOptions = {};
        if (!this.chartOptions.plotOptions.funnel)
          this.chartOptions.plotOptions.funnel = {};
        this.chartOptions.plotOptions.funnel.reversed = true;
        break;
    }

    // Ajouter une barre d'outils personnalisée si showToolbar est activé
    if (this.config.showToolbar) {
      this.addCustomToolbar();
    }
  }

  private addCustomToolbar(): void {
    if (!this.chartOptions.exporting) {
      this.chartOptions.exporting = {};
    }

    this.chartOptions.exporting.buttons = {
      ...this.chartOptions.exporting.buttons,
      customButton: {
        text: '',
        onclick: () => {},
        symbol: 'circle',
        className: 'highcharts-toolbar-custom',
        menuItems: this.createCustomToolbarItems(),
      },
    };
  }

  private createCustomToolbarItems(): any[] {
    const items = [];

    // Ajouter le bouton "précédent"
    items.push({
      text: 'Type précédent',
      onclick: () => {
        this.zone.run(() => this.changeChartType('previous'));
      },
      icon: ICONS.previous,
    });

    // Ajouter le bouton "suivant"
    items.push({
      text: 'Type suivant',
      onclick: () => {
        this.zone.run(() => this.changeChartType('next'));
      },
      icon: ICONS.next,
    });

    // Ajouter le bouton "pivoter" si disponible
    if (this._charts[this._type]?.canPivot !== false) {
      items.push({
        text: 'Pivoter les données',
        onclick: () => {
          this.zone.run(() => this.changeChartType('pivot'));
        },
        icon: ICONS.pivot,
      });
    }

    return items;
  }

  public changeChartType(action: ChartCustomEvent): void {
    if (this.debug) {
      console.log('[HIGHCHARTS] changeChartType', action);
    }

    const currentType = this._type;
    const possibleTypes = this._charts[currentType]?.possibleType || [];
    const currentIndex = possibleTypes.indexOf(currentType);

    if (action === 'previous' && currentIndex > -1) {
      this._type =
        currentIndex === 0
          ? possibleTypes[possibleTypes.length - 1]
          : possibleTypes[currentIndex - 1];
      this.updateTypeSpecificOptions();
      this.updateChart();
      this.customEvent.emit(action);
    } else if (action === 'next' && currentIndex > -1) {
      this._type =
        currentIndex === possibleTypes.length - 1
          ? possibleTypes[0]
          : possibleTypes[currentIndex + 1];
      this.updateTypeSpecificOptions();
      this.updateChart();
      this.customEvent.emit(action);
    } else if (action === 'pivot') {
      this.config = this.config.pivot
        ? { ...this.config, pivot: false }
        : { ...this.config, pivot: true };
      this.updateData();
      this.updateChart();
      this.customEvent.emit(action);
    }
  }
}
