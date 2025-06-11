// import { Directive, inject, ElementRef, NgZone, Input } from '@angular/core';
// import { XaxisType, YaxisType, mergeDeep } from '@oneteme/jquery-core';
// import { BaseChartDirective } from './base-chart.directive';
// import { Highcharts, initializeHighchartsModules } from './utils/highcharts-modules';
// import { sanitizeChartDimensions } from './utils/chart-utils';

// @Directive({
//   selector: '[map-chart]',
//   standalone: true,
// })
// export class MapChartDirective<X extends XaxisType> extends BaseChartDirective<
//   X,
//   YaxisType
// > {
//   @Input({ alias: 'type' }) override type = 'map' as const;

//   constructor() {
//     super(inject(ElementRef), inject(NgZone));
//     initializeHighchartsModules();
//   }

//   protected override updateChartType(): void {
//     mergeDeep(this._options, {
//       chart: {
//         type: 'map'
//       },
//       mapNavigation: {
//         enabled: true,
//         enableButtons: true
//       },
//       colorAxis: {
//         min: 0,
//         minColor: '#E6EFFF',
//         maxColor: '#004CCC'
//       }
//     });
//   }  protected override updateConfig(): void {
//     this._chartConfig = this.config;

//     mergeDeep(
//       this._options,
//       {
//         chart: {
//           height: this._chartConfig.height ?? '100%',
//           width: this._chartConfig.width ?? '100%',
//         },
//         title: { text: this._chartConfig.title },
//         subtitle: { text: this._chartConfig.subtitle },
//         exporting: {
//           enabled: this._chartConfig.showToolbar ?? true,
//           buttons: {
//             contextButton: {
//               enabled: this._chartConfig.showToolbar ?? true,
//             },
//           },
//         },
//       },
//       this._chartConfig.options ?? {}
//     );

//     // Utiliser sanitizeChartDimensions pour corriger les dimensions
//     sanitizeChartDimensions(this._options, this._chartConfig);
//   }protected override updateData(): void {
//     this.processMapData();
//   }
//   private processMapData(): void {
//     try {
//       // Vérifier que nous avons des données
//       if (!this.data || this.data.length === 0) {
//         mergeDeep(this._options, {
//           series: [{
//             type: 'map',
//             name: 'Aucune donnée',
//             data: []
//           }]
//         });
//         this.createChart();
//         return;
//       }

//       // Transformation des données pour Highcharts Maps
//       const mapData = this.data.map((item: any, index: number) => ({
//         name: item.name ?? `Région ${index + 1}`,
//         value: typeof item.value === 'number' ? item.value : 0,
//         code: item.code ?? `CODE_${index}`,
//         'hc-key': item.code ?? `fr-${index}`,
//         ...item
//       }));

//       // Configuration de la série
//       mergeDeep(this._options, {
//         series: [{
//           type: 'map',
//           name: this._chartConfig?.series?.[0]?.name || 'Données',
//           data: mapData,
//           dataLabels: {
//             enabled: true,
//             format: '{point.name}'
//           },
//           tooltip: {
//             pointFormat: '{point.name}: <b>{point.value:,.0f}</b>'
//           }
//         }]
//       });

//       this.createChart();
//     } catch (error) {
//       console.error('Erreur lors du traitement des données de carte:', error);
//     }
//   }protected override createChart(): void {
//     if ((Highcharts as any).mapChart) {
//       this.chart = (Highcharts as any).mapChart(
//         this.el.nativeElement,
//         this._options
//       );
//     } else {
//       this.chart = Highcharts.chart(
//         this.el.nativeElement,
//         this._options
//       );
//     }
//   }
// }
