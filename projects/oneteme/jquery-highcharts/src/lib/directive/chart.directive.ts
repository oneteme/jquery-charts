import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  ChartProvider,
  ChartType,
  XaxisType,
  YaxisType,
  buildChart,
  buildSingleSerieChart,
} from '@oneteme/jquery-core';
import { Highcharts, sanitizeChartDimensions } from './utils';

@Directive({
  selector: '[chart-directive]',
  standalone: true,
})
export class ChartDirective<X extends XaxisType, Y extends YaxisType>
  implements OnChanges, OnDestroy
{
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) config!: ChartProvider<X, Y>;
  @Input({ required: true }) data!: any[];
  @Input() possibleType?: ChartType[];
  @Input() debug: boolean = false;
  @Output() customEvent = new EventEmitter<string>();

  private chart: Highcharts.Chart | null = null;

  constructor(private elementRef: ElementRef, private ngZone: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['data'] || changes['type']) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private updateChart(): void {
    if (!this.config || !this.data) {
      this.debug && console.log('Configuration ou données manquantes');
      return;
    }

    this.destroyChart();
    this.createChart();
  }

  private createChart(): void {
    try {
      const element = this.elementRef.nativeElement;
      if (!element) {
        this.debug && console.log('Element not available');
        return;
      }

      const options = this.buildChartOptions();
      
      sanitizeChartDimensions(options, this.config, element, this.debug);

      this.chart = Highcharts.chart(element, options);

      this.debug && console.log('Graphique créé:', this.type);

    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
    }
  }

  private buildChartOptions(): Highcharts.Options {
    const chartData = this.processData();

    const baseOptions: Highcharts.Options = {
      chart: {
        type: this.getHighchartsType(),
        height: this.config.height || undefined,
        width: this.config.width || undefined,
      },
      title: {
        text: this.config.title || '',
      },
      subtitle: {
        text: this.config.subtitle || '',
      },
      credits: {
        enabled: false,
      },
      exporting: {
        enabled: this.config.showToolbar !== false,
        buttons: {
          contextButton: {
            menuItems: ['downloadPNG', 'downloadJPEG', 'downloadSVG'],
          },
        },
      },
      series: chartData.series,
      xAxis: chartData.xAxis,
      yAxis: {
        title: {
          text: this.config.ytitle || '',
        },
      },
    };

    // Options spécifiques pour les graphiques donut
    if (this.type === 'donut') {
      baseOptions.plotOptions = {
        pie: {
          innerSize: '40%',
        },
      };
    }

    // Merge avec les options personnalisées
    let finalOptions = baseOptions;
    if (this.config.options) {
      finalOptions = Highcharts.merge(baseOptions, this.config.options);
    }

    return finalOptions;
  }

  private processData(): { series: any[]; xAxis?: any } {
    if (this.isSimpleChart()) {
      return this.processSimpleChart();
    } else {
      return this.processComplexChart();
    }
  }

  private processSimpleChart(): { series: any[] } {
    const chartConfig = { ...this.config, continue: false };
    const commonChart = buildSingleSerieChart(this.data, chartConfig, null);

    return {
      series: [
        {
          name: commonChart.title || 'Données',
          data: commonChart.series[0]?.data || [],
        },
      ],
    };
  }

  private processComplexChart(): { series: any[]; xAxis: any } {
    const chartConfig = { ...this.config, continue: false };
    const commonChart = buildChart(this.data, chartConfig, null);

    return {
      series: commonChart.series || [],
      xAxis: {
        categories: commonChart.categories || [],
        title: {
          text: this.config.xtitle || '',
        },
      },
    };
  }

  private isSimpleChart(): boolean {
    return ['pie', 'donut', 'funnel', 'pyramid'].includes(this.type);
  }

  private getHighchartsType(): string {
    const typeMapping: { [key: string]: string } = {
      donut: 'pie',
      columnpyramid: 'column',
      areaspline: 'areaspline',
      columnrange: 'columnrange',
      arearange: 'arearange',
      areasplinerange: 'areasplinerange',
    };

    return typeMapping[this.type] || this.type;
  }

  private destroyChart(): void {
    if (this.chart) {
      try {
        this.chart.destroy();
        this.debug && console.log('Graphique détruit');
      } catch (error) {
        console.error('Erreur lors de la destruction:', error);
      } finally {
        this.chart = null;
      }
    }
  }
}
