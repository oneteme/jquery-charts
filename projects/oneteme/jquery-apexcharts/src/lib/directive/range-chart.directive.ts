import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, inject } from "@angular/core";
import { ChartProvider, ChartView, CommonChart, CommonSerie, Coordinate2D, XaxisType, YaxisType, buildChart, distinct, mergeDeep } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";

@Directive({
    selector: '[range-chart]'
})
export class RangeChartDirective<X extends XaxisType> implements ChartView<X, number[]>, OnChanges, OnDestroy {
    private el: ElementRef = inject(ElementRef);

    private _chart: ApexCharts;
    private _chartConfig: ChartProvider<X, number[]> = {};

    private _options: any = {
        chart: {
            type: 'rangeArea'
        },
        series: []
    };

    @Input({ required: true }) type: 'rangeArea' | 'rangeBar' | 'rangeColumn';

    @Input({ required: true }) config: ChartProvider<X, number[]>;

    @Input({ required: true }) data: any[];

    @Input() canPivot: boolean = true;

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
        }
    }

    updateType() {
        mergeDeep(this._options, { chart: { type: this.type == 'rangeColumn' ? 'rangeBar' : this.type } })
    }

    updateConfig() {
        let that = this;
        this._chartConfig = this.config;
        var customIcons = [{
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
        }];
        if (this.canPivot) {
            customIcons.push({
                icon: '<img src="/assets/icons/pivot_table_chart.svg" width="15">',
                title: 'Pivot',
                class: 'custom-icon',
                click: function (chart, options, e) {
                    that.customEvent.emit("pivot");
                }
            });
        }
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
                        customIcons: customIcons
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
        }, this.type == 'rangeBar' ? {
            plotOptions: {
                bar: {
                    horizontal: true
                }
            }
        } : {}, this._chartConfig.options);
    }

    updateData() {
        var commonChart = buildChart(this.data, { ...this._chartConfig, continue: true, pivot: !this.canPivot ? false: this._chartConfig.pivot }, null);
        let type: 'category' | 'datetime' | 'numeric' = 'datetime';
        if (commonChart.continue) {
            var x = (<CommonChart<X, Coordinate2D>>commonChart).series[0].data[0].x;
            type = x instanceof Date ? 'datetime' : typeof x == 'number' ? 'numeric' : 'category';
        }
        mergeDeep(this._options, { series: commonChart.series, xaxis: { type: type } });
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

    render() {
        this._chart.render();
    }

}