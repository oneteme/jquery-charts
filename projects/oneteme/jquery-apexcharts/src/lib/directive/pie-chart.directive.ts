import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, inject } from "@angular/core";
import { ChartProvider, ChartView, DataProvider, SerieProvider, buildChart, buildSingleSerieChart, distinct, mergeDeep } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";
import { asapScheduler } from "rxjs";

@Directive({
    selector: '[pie-chart]'
})
export class PieChartDirective implements ChartView<string, number>, OnChanges, OnDestroy {
    private el: ElementRef = inject(ElementRef);

    private _chart: ApexCharts;
    private _chartConfig: ChartProvider<string, number> = {};
    private _options: any = {
        chart: {
            type: 'pie'
        },
        series: []
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
        if (this.type && this.config && this.data) {
            if (changes.type) {
                this.updateType();
            }
            if (changes.isLoading) {
                this.updateLoading();
            }
            if (changes.config) {
                this.updateConfig();
            }
            if (changes.config || changes.data) {
                this.updateData();
            }
            this.updateChart();
            console.log(this.data)
        }

        console.log(this.data)
    }

    updateType() {
        mergeDeep(this._options, { chart: { type: this.type } })
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
                            icon: '<img src="/assets/icons/arrow_back_ios.svg" width="15">',
                            title: 'Graphique précédent',
                            class: 'custom-icon',
                            click: function (chart, options, e) {
                                that.customEvent.emit("previous");
                            }
                        },
                        {
                            icon: '<img src="/assets/icons/arrow_forward_ios.svg" width="15">',
                            title: 'Graphique suivant',
                            class: 'custom-icon',
                            click: function (chart, options, e) {
                                that.customEvent.emit("next");
                            }
                        }, {
                            icon: '<img src="/assets/icons/pivot_table_chart.svg" width="15">',
                            title: 'Pivot',
                            class: 'custom-icon',
                            click: function (chart, options, e) {
                                that.customEvent.emit("pivot");
                            }
                        }]
                    }
                },
                events: {
                    mouseMove: function (e, c, config) { that.el.nativeElement.querySelector('.apexcharts-toolbar').style.visibility = "visible" },
                    mouseLeave: function (e, c, config) { that.el.nativeElement.querySelector('.apexcharts-toolbar').style.visibility = "hidden" }
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
        var commonChart = buildSingleSerieChart(this.data, { ...this._chartConfig, continue: false }, null);
        var colors = commonChart.series.filter(d => d.color).map(d => <string>d.color);
        mergeDeep(this._options, { series: commonChart.series.flatMap(s => s.data.filter(d => d != null)), labels: commonChart.categories || [], colors: colors || [] });
        console.log('commonPieChart', commonChart)
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
            this._chart.destroy();
        }
        this.createChart();
        this.render();
    }

    createChart() {
        this._chart = new ApexCharts(this.el.nativeElement, this._options);
    }

    // updateOptions() {
    //     this._chart.resetSeries();
    //     if (this._options.chart.id) {
    //         ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options);
    //     } else {
    //         this._chart.updateOptions(this._options, false, false);
    //     }
    // }

    render() {
        this._chart.render();
    }
}