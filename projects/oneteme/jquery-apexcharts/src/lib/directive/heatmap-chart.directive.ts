import { Directive, ElementRef, inject } from "@angular/core";
import { ChartView } from "@oneteme/jquery-core";
import ApexCharts from "apexcharts";
@Directive({
    selector: '[heatmap-chart]'
})
export class HeatmapChartDirective {
    private el: ElementRef = inject(ElementRef);

    private _chart: ApexCharts;

    ngAfterViewInit() {
        var _options = {
            chart: {
                type: 'heatmap'
            },
            series: [
                {
                    name: "Series 1",
                    color: '#E4080A',
                    data: [{
                        x: 'W1',
                        y: 22
                    }, {
                        x: 'W2',
                        y: 29
                    }, {
                        x: 'W3',
                        y: 13
                    }, {
                        x: 'W4',
                        y: 32
                    }]
                },
                {
                    name: "Series 2",
                    data: [{
                        x: 'W1',
                        y: 43
                    }, {
                        x: 'W2',
                        y: 43
                    }, {
                        x: 'W3',
                        y: 43
                    }, {
                        x: 'W4',
                        y: 43
                    }]
                }
            ]
        }
        this._chart = new ApexCharts(this.el.nativeElement, _options);
        this._chart.render();
    }
}