import { Directive, ElementRef, Input, NgZone, OnDestroy, inject } from "@angular/core";
import { ChartConfig, ChartView, DataSet, mergeDeep } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";

@Directive({
    selector: '[line-chart]'
})
export class LineChartDirective implements ChartView, OnDestroy {
    private el: ElementRef = inject(ElementRef);
    private ngZone: NgZone = inject(NgZone);

    private _chart: ApexCharts;
    private _chartConfig: ChartConfig = {};
    private _options: any = {
        chart: {
            type: 'line',
            animations: {
                enabled: false
            }
        },
        series: [],
        markers: {
            size: 0
        }
    };

    private _isDataLoaded: boolean;

    @Input() set type(value: 'line' | 'area') {
        if (value) {
            mergeDeep(this._options, {
                chart: { type: value }
            });
            this.updateChart(this._isDataLoaded);
        }
    }

    @Input() set config(object: ChartConfig) {
        if (object) {
            this._chartConfig = object;
            mergeDeep(this._options, {
                title: {
                    text: this._chartConfig.title
                },
                subtitle: {
                    text: this._chartConfig.subtitle
                },
                xaxis: {
                    title: {
                        text: this._chartConfig.xtitle
                    },
                    tickPlacement: 'between'
                },
                yaxis: {
                    title: {
                        text: this._chartConfig.ytitle
                    }
                }
            }, this._chartConfig.options);
            this.updateChart(this._isDataLoaded);
        }
    }

    @Input() set data(objects: any[]) {
        this._isDataLoaded = false;
        let series: any[] = [];
        let categories: any[] = [];
        let type: 'category' | 'datetime' | 'numeric' = 'datetime';
        if (objects && objects.length) {
            let category = this._chartConfig.category;
            let mappers = this._chartConfig.mappers;

            let dataSet = new DataSet(objects, category?.mapper);

            series = dataSet.data(mappers, 0).map(d => ({ name: d.mapper.label, color: d.mapper.color, data: d.data }));

            categories = dataSet.labels;
            type = category.type == 'date' ? 'datetime' :
                category.type == 'string' ? 'category' : 'numeric';

            this._isDataLoaded = true;
        }
        mergeDeep(this._options, { series: series, xaxis: { type: type, categories: categories, overwriteCategories: categories } });
        this.updateChart();
    }

    @Input() set isLoading(val: boolean) {
        mergeDeep(this._options, {
            noData: {
                text: val ? 'Loading...' : 'Aucune donnée'
            }
        });
        this.updateChart();
    }

    ngOnDestroy(): void {
        if (this._chart) {
            this._chart.destroy();
        }
    }

    updateChart(refresh: boolean = true) {
        if (this._chart) {
            if (refresh) {
                this.updateOptions();
            }
        } else {
            this.createChart();
            this.render();
        }
    }

    createChart() {
        this.ngZone.runOutsideAngular(() => this._chart = new ApexCharts(this.el.nativeElement, this._options));
    }

    updateOptions() {
        this._chart.resetSeries();
        if (this._options.chart.id) {
            this.ngZone.runOutsideAngular(() => ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options));
        } else {
            this.ngZone.runOutsideAngular(() => this._chart.updateOptions(this._options, false, false));
        }
    }

    render() {
        this.ngZone.runOutsideAngular(() => this._chart.render());
    }
}