import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, inject } from "@angular/core";
import { ChartProvider, ChartView, distinct, mergeDeep, pivotSeries, series } from "@oneteme/jquery-core";
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
            this.updateChart();
        }
    }

    updateConfig() {
        this._chartConfig = this.config;
        mergeDeep(this._options, {
            chart: {
                height: this._chartConfig.height ?? '100%',
                width: this._chartConfig.width ?? '100%'
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
        let categories: string[] = [];
        let commonSeries: number[] = [];
        let colors: string[] = [];
        if (this.data.length) {
            categories = distinct(this.data, this._chartConfig.series.map(m => m.data.x));
            commonSeries = (this._chartConfig.pivot 
                ? pivotSeries(this.data, this._chartConfig.series, false)
                : series(this.data, this._chartConfig.series, false)).flatMap(s => <number[]>s.data);
            colors = this._chartConfig.series.filter(d => d.color).map(d => <string>d.color); //deprecated color: already returned
        }
        mergeDeep(this._options, { series: commonSeries, labels: categories, colors: colors });
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