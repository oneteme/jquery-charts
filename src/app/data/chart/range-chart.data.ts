import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, RangeChartData } from '../../core/models/chart.model';

export const RANGE_CHART_DATA: ChartDataCollection<RangeChartData> = {
  rangeExample: {
    data: [
      { min: 96.1, max: 99.2, field: 'Jan' },
      { min: 96.8, max: 99.4, field: 'Fév' },
      { min: 95.6, max: 99.0, field: 'Mar' },
      { min: 97.2, max: 99.6, field: 'Avr' },
      { min: 97.8, max: 99.7, field: 'Mai' },
      { min: 96.9, max: 99.3, field: 'Juin' },
    ],
    config: {
      title: 'Disponibilité des services (SLA)',
      subtitle: 'Plage mensuelle min/max',
      series: [
        {
          data: { x: field('field'), y: field('min') },
          name: 'Min',
        },
        {
          data: { x: field('field'), y: field('max') },
          name: 'Max',
        },
      ],
      height: 250,
      showToolbar: true,
      options: {
        colors: ['#4AA3A2'],
        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
              format: '{point.low}% - {point.high}%'
            }
          }
        },
        tooltip: {
          pointFormat: '<b>{point.low}% - {point.high}%</b>'
        },
        xAxis: {
          title: { text: null }
        },
        yAxis: {
          min: 95,
          max: 100,
          tickAmount: 4
        }
      }
    },
  },
};
