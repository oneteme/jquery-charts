import { field } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  HeatmapChartData,
} from '../../core/models/chart.model';

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
      options: {
        plotOptions: {
          heatmap: {
            enableShades: true,
            shadeIntensity: 0.5,
            colorScale: {
              ranges: [
                {
                  from: 0,
                  to: 15,
                  name: 'Faible',
                  color: '#137C8B'
                },
                {
                  from: 16,
                  to: 30,
                  name: 'Modéré',
                  color: '#709CA7'
                },
                {
                  from: 31,
                  to: 50,
                  name: 'Élevé',
                  color: '#344D59'
                }
              ]
            },
            radius: 2
          }
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '11px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: ['#fff']
          }
        },
        xaxis: {
          labels: {
            rotate: 0,
            style: {
              fontSize: '10px'
            }
          },
          title: {
            text: 'Heure de la journée',
            style: {
              fontSize: '12px',
              fontWeight: 'bold'
            }
          }
        },
        yaxis: {
          title: {
            text: 'Jour de la semaine',
            style: {
              fontSize: '12px',
              fontWeight: 'normal'
            }
          }
        },
        stroke: {
          width: 1,
          colors: ['#fff']
        },
        tooltip: {
          custom: function({ series, seriesIndex, dataPointIndex, w }) {
            const jour = w.globals.seriesNames[seriesIndex];
            const heure = w.globals.labels[dataPointIndex];
            const valeur = series[seriesIndex][dataPointIndex];
            
            return `
              <div style="padding: 5px">
                <div style="font-weight: bold; margin-bottom: 5px">
                  ${jour} à ${heure}
                </div>
                <p>Trafic: ${valeur} utilisateurs</p>
              </div>
            `;
          }
        },
        title: {
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        subtitle: {
          style: {
            fontSize: '12px',
            fontWeight: 'normal'
          }
        },
        legend: {
          offsetX: 25,
          position: 'bottom',
          horizontalAlign: 'center',
          markers: {
            radius: 2
          }
        }
      }
    }
  }
};