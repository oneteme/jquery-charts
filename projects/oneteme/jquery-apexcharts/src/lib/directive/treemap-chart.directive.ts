import { Directive, ElementRef, NgZone, OnDestroy, inject } from "@angular/core";
import ApexCharts from "apexcharts";

@Directive({
    selector: '[treemap-chart]'
})
export class TreemapChartDirective implements OnDestroy {
    private el: ElementRef = inject(ElementRef);
    private ngZone: NgZone = inject(NgZone);

    private _chart: ApexCharts;
    private _options: any;

    ngAfterViewInit() {
        this._options = {
            chart: {
                type: 'treemap',
                animations: {
                    enabled: false
                }
            },
            series: [218, 149, 184, 55, 84, 31, 70, 30, 44, 68, 28, 19, 29],
            xaxis: {
                type: 'string', categories: [
                    "New Delhi",
                    "Kolkata",
                    "Mumbai",
                    "Ahmedabad",
                    "Bangaluru",
                    "Pune",
                    "Chennai",
                    "Jaipur",
                    "Surat",
                    "Hyderabad",
                    "Lucknow",
                    "Indore",
                    "Kanpur"
                ]
            },
            markers: {
                size: 0
            }
        }
        let options2 = {
            series: [
                {
                    data: [
                        {
                            x: "New Delhi",
                            y: 218
                        },
                        {
                            x: "Kolkata",
                            y: 149
                        },
                        {
                            x: "Mumbai",
                            y: 184
                        },
                        {
                            x: "Ahmedabad",
                            y: 55
                        },
                        {
                            x: "Bangaluru",
                            y: 84
                        },
                        {
                            x: "Pune",
                            y: 31
                        },
                        {
                            x: "Chennai",
                            y: 70
                        },
                        {
                            x: "Jaipur",
                            y: 30
                        },
                        {
                            x: "Surat",
                            y: 44
                        },
                        {
                            x: "Hyderabad",
                            y: 68
                        },
                        {
                            x: "Lucknow",
                            y: 28
                        },
                        {
                            x: "Indore",
                            y: 19
                        },
                        {
                            x: "Kanpur",
                            y: 29
                        }
                    ]
                }
            ],

            chart: {
                height: 350,
                type: "treemap"
            },
            title: {
                text: "Basic Treemap"
            }
        };
        this._chart = new ApexCharts(this.el.nativeElement, this._options)
        this._chart.render()
    }

    ngOnDestroy(): void {
        if (this._chart) {
            this._chart.destroy();
        }
    }
}