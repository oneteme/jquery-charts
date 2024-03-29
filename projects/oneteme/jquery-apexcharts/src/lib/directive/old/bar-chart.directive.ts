// import { Directive, ElementRef, Input, NgZone, OnDestroy, SimpleChanges, inject } from "@angular/core";
// import { ChartConfig, ChartView, mergeDeep } from "@oneteme/jquery-core";
// import ApexCharts from "apexcharts";

// @Directive({
//   selector: '[bar-chart]'
// })
// export class BarChartDirective<T extends BarChartMapper> implements ChartView<T>, OnDestroy {
//   private el: ElementRef = inject(ElementRef);
//   private ngZone: NgZone = inject(NgZone);

//   private _chart: ApexCharts;
//   private _chartConfig: ChartConfig<T> = {};
//   private _options: any = {
//     chart: {
//       type: 'bar',
//       animations: {
//         enabled: false
//       }
//     },
//     series: [],
//     markers: {
//       size: 0
//     }
//   };

//   @Input({required: true}) type: 'bar' | 'funnel' | 'pyramid';

//   @Input({required: true}) config: ChartConfig<T>;

//   @Input({required: true}) data: any[];

//   @Input() isLoading: boolean = false;

//   updateConfig() {
//     this._chartConfig = this.config;
//     mergeDeep(this._options, {
//       title: {
//         text: this._chartConfig.title
//       },
//       subtitle: {
//         text: this._chartConfig.subtitle
//       },
//       xaxis: {
//         title: {
//           text: this._chartConfig.xtitle
//         }
//       },
//       yaxis: {
//         title: {
//           text: this._chartConfig.ytitle
//         }
//       }
//     }, this._chartConfig.options);
//   }

//   updateData() {
//     let series: any[] = [];
//     let categories: string[] = [];
//     let type: 'category' | 'datetime' | 'numeric' = 'datetime';
//     if (this.data.length) {
//       let category = this._chartConfig.category;
//       let mappers = this._chartConfig.mappers;

//       let dataSet = new DataSet(this.data, category?.mapper);

//       categories = dataSet.labels;
//       type = category.type === 'date' ? 'datetime' :
//         category.type === 'string' ? 'category' : 'numeric';

//       series = dataSet.data(mappers, 0).map(d => {
//         let data: any[] = d.data;
//         if(this.type == 'funnel') {
//           data.sort((a, b) => b - a);
//         } else if(this.type == 'pyramid') {
//           data.sort((a, b) => a - b);
//         }
//         return { name: d.name, color: d.mapper.color, group: d.group, data: data };
//       });
//     }
//     mergeDeep(this._options, { series: series, xaxis: { type: type, categories: categories } });
//   }

//   updateLoading() {
//     mergeDeep(this._options, {
//       noData: {
//         text: this.isLoading ? 'Loading...' : 'Aucune donnée'
//       }
//     });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if(changes.isLoading) {
//       this.updateLoading();
//     }
//     if(changes.type && changes.config && changes.data) {
//       if(changes.type.previousValue != changes.type.currentValue) {
//         this.updateConfig();
//       }
//       if(changes.data.previousValue != changes.data.currentValue) {
//         this.updateData();
//       }
//       this.updateChart();
//     }
//   }

//   ngOnDestroy(): void {
//     if (this._chart) {
//       this._chart.destroy();
//     }
//   }

//   updateChart() {
//     console.log("updateChart")
//     if (this._chart) {
//       this.updateOptions();
//     } else {
//       this.createChart();
//       this.render();
//     }
//   }

//   createChart() {
//     this.ngZone.runOutsideAngular(() => this._chart = new ApexCharts(this.el.nativeElement, this._options));
//   }

//   updateOptions() {
//     this._chart.resetSeries();
//     if (this._options.chart.id) {
//       this.ngZone.runOutsideAngular(() => ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options));
//     } else {
//       this.ngZone.runOutsideAngular(() => this._chart.updateOptions(this._options, false, false));
//     }
//   }

//   render() {
//     this.ngZone.runOutsideAngular(() => this._chart.render());
//   }
// }