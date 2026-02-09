import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, HeatmapChartData } from '../../core/models/chart.model';

export const HEATMAP_CHART_DATA: ChartDataCollection<HeatmapChartData> = {
  heatmapExample: {
    data: [
      { valeur: 12, heure: '00h', jour: 'Lun' },
      { valeur: 19, heure: '04h', jour: 'Lun' },
      { valeur: 25, heure: '08h', jour: 'Lun' },
      { valeur: 42, heure: '12h', jour: 'Lun' },
      { valeur: 35, heure: '16h', jour: 'Lun' },
      { valeur: 22, heure: '20h', jour: 'Lun' },
      { valeur: 10, heure: '00h', jour: 'Mar' },
      { valeur: 15, heure: '04h', jour: 'Mar' },
      { valeur: 30, heure: '08h', jour: 'Mar' },
      { valeur: 45, heure: '12h', jour: 'Mar' },
      { valeur: 38, heure: '16h', jour: 'Mar' },
      { valeur: 20, heure: '20h', jour: 'Mar' },
      { valeur: 8, heure: '00h', jour: 'Mer' },
      { valeur: 13, heure: '04h', jour: 'Mer' },
      { valeur: 35, heure: '08h', jour: 'Mer' },
      { valeur: 50, heure: '12h', jour: 'Mer' },
      { valeur: 40, heure: '16h', jour: 'Mer' },
      { valeur: 25, heure: '20h', jour: 'Mer' },
      { valeur: 7, heure: '00h', jour: 'Jeu' },
      { valeur: 14, heure: '04h', jour: 'Jeu' },
      { valeur: 32, heure: '08h', jour: 'Jeu' },
      { valeur: 48, heure: '12h', jour: 'Jeu' },
      { valeur: 39, heure: '16h', jour: 'Jeu' },
      { valeur: 21, heure: '20h', jour: 'Jeu' },
      { valeur: 9, heure: '00h', jour: 'Ven' },
      { valeur: 16, heure: '04h', jour: 'Ven' },
      { valeur: 28, heure: '08h', jour: 'Ven' },
      { valeur: 46, heure: '12h', jour: 'Ven' },
      { valeur: 36, heure: '16h', jour: 'Ven' },
      { valeur: 18, heure: '20h', jour: 'Ven' },
    ],
    config: {
      title: 'Trafic hebdomadaire',
      series: [
        {
          data: { x: field('heure'), y: field('valeur') },
          name: field('jour'),
        },
      ],
      height: 250,
      showToolbar: true,
      options: {
        plotOptions: {
          series: {
            borderWidth: 1,
            dataLabels: {
              enabled: true,
              format: '{point.value}'
            }
          }
        },
        colorAxis: {
          stops: [
            [0, '#137C8B'],
            [0.5, '#709CA7'],
            [1, '#344D59']
          ]
        },
        xAxis: {
          title: { text: 'Heure de la journée' }
        },
        yAxis: {
          title: { text: 'Jour de la semaine' }
        },
        tooltip: {
          pointFormat: '<b>{point.value} utilisateurs</b>'
        },
        legend: {
          align: 'center',
          verticalAlign: 'bottom'
        }
      }
    }
  }
};
