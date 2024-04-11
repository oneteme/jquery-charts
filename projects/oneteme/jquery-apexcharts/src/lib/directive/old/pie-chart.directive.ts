// import { Directive, ElementRef, Input, NgZone, OnDestroy, inject } from "@angular/core";
// import { ChartConfig, ChartView, DataSet, PieChartMapper, mergeDeep } from "@oneteme/jquery-core";
// import ApexCharts from "apexcharts";

// @Directive({
//     selector: '[pie-chart]'
// })
// export class PieChartDirective<T extends PieChartMapper> implements ChartView<T>, OnDestroy {
//     private el: ElementRef = inject(ElementRef);
//     private ngZone: NgZone = inject(NgZone);

//     private _chart: ApexCharts;
//     private _chartConfig: ChartConfig<T> = {};
//     private _options: any = {
//         chart: {
//             type: 'pie', // default value
//             animations: {
//                 enabled: false
//             }
//         },
//         series: [],
//         markers: {
//             size: 0
//         }
//     };
//     private _isDataLoaded: boolean;

//     @Input() set type(value: 'pie' | 'donut' | 'radialBar' | 'polarArea') {
//         if (value) {
//             mergeDeep(this._options, {
//                 chart: { type: value }
//             });
//             this.updateChart(this._isDataLoaded);
//         }
//     }

//     @Input() set config(object: ChartConfig<T>) {
//         if (object) {
//             this._chartConfig = object;
//             mergeDeep(this._options, {
//                 title: {
//                     text: this._chartConfig.title
//                 },
//                 subtitle: {
//                     text: this._chartConfig.subtitle
//                 },
//                 xaxis: {
//                     title: {
//                         text: this._chartConfig.xtitle
//                     }
//                 },
//                 yaxis: {
//                     title: {
//                         text: this._chartConfig.ytitle
//                     }
//                 }
//             }, this._chartConfig.options);
//             this.updateChart(this._isDataLoaded);
//         }
//     }

//     /* 
//         exemple 1 : [{count1: 2, count3: 3, count4: 5}] => 3 yDim
//         exemple 2 : [{count: 2, user: ""}, {count: 4, user: ""}] => 1yDim et 1xDim
//         exemple 3 : [{count: 2, user: "1", status: "200"}, {count: 4, user: "1", status: "400"}] => 1yDim et 2xDim
//         exemple 4 : [{count: 2, count2: 2, user: "1"}, {count: 4, count2: 2, user: "2"}] => 2yDim et 1xDim
//         exemple 5 : [{count: 2, count2: 2, user: "1", status: "200"}, {count: 4, count2: 2, user: "1", status: "400"}] => 2yDim et 2xDim (TODO)
//     */
//     @Input() set data(objects: any[]) {
//         this._isDataLoaded = false;
//         let series: number[] = [];
//         let labels: string[] = [];
//         let colors: string[] = [];
//         if (objects && objects.length) {
//             console.log('data pie chart 2', objects);
//             let category = this._chartConfig.category;
//             let mappers = this._chartConfig.mappers;

//             if (category && mappers.length > 1) {
//                 throw Error('Plusieurs dimensions impossible');
//             } else {
//                 let dataSet = category?.mapper ? new DataSet(objects, category.mapper) : new DataSet(objects, 'label', mappers);
//                 let data = dataSet.data(mappers, 0);
//                 series = data.flatMap(d => d.data);
//                 labels = dataSet.labels;
//                 colors = data.filter(d => d.mapper.color).map(d => d.mapper.color);
//             }
//             this._isDataLoaded = true;
//         }
//         mergeDeep(this._options, { series: series, labels: labels, colors: colors });
//         this.updateChart();
//     }

//     @Input() set isLoading(val: boolean) {
//         mergeDeep(this._options, {
//             noData: { text: val ? 'Loading...' : 'Aucune donnée' }
//         });
//         this.updateChart();
//     }

//     ngOnDestroy(): void {
//         if (this._chart) {
//             this._chart.destroy();
//         }
//     }

//     updateChart(refresh : boolean = true) {
//         if (this._chart) {
//             if(refresh){
//                 this.updateOptions();
//             }
//         } else {
//             this.createChart();
//             this.render();
//         }
//     }

//     createChart() {
//         this.ngZone.runOutsideAngular(() => this._chart = new ApexCharts(this.el.nativeElement, this._options));
//     }

//     updateOptions() {
//         this._chart.resetSeries();
//         if (this._options.chart.id) {
//             this.ngZone.runOutsideAngular(() => ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options));
//         } else {
//             this.ngZone.runOutsideAngular(() => this._chart.updateOptions(this._options, false, false));
//         }
//     }

//     render() {
//         this.ngZone.runOutsideAngular(() => this._chart.render());
//     }
// }