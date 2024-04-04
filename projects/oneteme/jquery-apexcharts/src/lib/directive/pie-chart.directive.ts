import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, inject } from "@angular/core";
import { ChartProvider, ChartView, DataProvider, SerieProvider, buildChart, buildSingleSerieChart, distinct, mergeDeep } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";

@Directive({
    selector: '[pie-chart]'
})
export class PieChartDirective implements ChartView<string, number>, OnChanges, OnDestroy {
    private el: ElementRef = inject(ElementRef);
    private ngZone: NgZone = inject(NgZone);

    private _chart: ApexCharts;
    private _chartConfig: ChartProvider<string, number> = {};
    private _options: any = {
        chart: {
            type: 'pie',
            animations: {
                enabled: false
            }
        },
        series: [],
        markers: {
            size: 0
        }
    };

    @Input({ required: true }) type: 'pie' | 'donut' | 'radialBar' | 'polarArea';

    @Input({ required: true }) config: ChartProvider<string, number>;

    @Input({ required: true }) data: any[];

    @Input() isLoading: boolean = false;

    @Output() customEvent: EventEmitter<'previous' | 'next' | 'pivot'> = new EventEmitter();

    ngOnDestroy(): void {
        if (this._chart) {
            this._chart.destroy();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.isLoading) {
            this.updateLoading();
        }
        if (changes.type && changes.config && changes.data) {
            if (changes.type.previousValue != changes.type.currentValue) {
                this.updateConfig();
            }
            if (changes.data.previousValue != changes.data.currentValue) {
                this.updateData();
            }
            console.log("pieOnChange", changes.type, changes.config, changes.data);
            this.updateChart();
        }
    }

    updateConfig() {
        let that = this;
        this._chartConfig = this.config;
        mergeDeep(this._options, {
            chart: {
                height: this._chartConfig.height ?? '100%',
                width: this._chartConfig.width ?? '100%',
                toolbar: {
                    show: true,
                    tools: {
                      download: false,
                      selection: false,
                      zoom: false,
                      zoomin: false,
                      zoomout: false,
                      pan: false,
                      reset: false,
                      customIcons: [{
                        icon: '<img src="/assets/icons/arrow_back_ios.svg" width="20">',
                        title: 'Graphique précédent',
                        click: function (chart, options, e) {
                          that.customEvent.emit("previous");
                        }
                      },
                      {
                        icon: '<img src="/assets/icons/arrow_forward_ios.svg" width="20">',
                        title: 'Graphique suivant',
                        click: function (chart, options, e) {
                          that.customEvent.emit("next");
                        }
                      }, {
                        icon: '<img src="/assets/icons/pivot_table_chart.svg" width="20">',
                        title: 'Graphique suivant',
                        click: function (chart, options, e) {
                          that.customEvent.emit("pivot");
                        }
                      }]
                    }
                  }
            },
            title: {
                text: this._chartConfig.title
            },
            subtitle: {
                text: this._chartConfig.subtitle
            },
            xaxis: {
                title: {
                    text: this._chartConfig.xtitle
                }
            },
            yaxis: {
                title: {
                    text: this._chartConfig.ytitle
                }
            }
        }, this._chartConfig.options);
    }

    updateData() {
        var commonChart = buildSingleSerieChart(this.data, this._chartConfig);
        var colors = commonChart.series.filter(d => d.color).map(d => <string>d.color); 
        console.log("pieCommonChart", commonChart)
        mergeDeep(this._options, { series: commonChart.series.flatMap(s => s.data), labels: commonChart.categories || [], colors: colors || [] });
        console.log("pieCommonChart2", this._options)
    }

    updateLoading() {
        mergeDeep(this._options, {
            noData: {
                text: this.isLoading ? 'Loading...' : 'Aucune donnée'
            }
        });
    }

    updateChart() {
        if (this._chart) {
            this.updateOptions();
        } else {
            this.createChart();
            this.render();
        }
    }

    createChart() {
       this._chart = new ApexCharts(this.el.nativeElement, this._options);
    }

    updateOptions() {
        this._chart.resetSeries();
        if (this._options.chart.id) {
            ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options);
        } else {
            this._chart.updateOptions(this._options, false, false);
        }
    }

    render() {
        this._chart.render();
    }
}