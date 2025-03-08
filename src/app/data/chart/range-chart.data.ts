import { field, rangeFields } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  RangeChartData,
} from '../../core/models/chart.model';

export const RANGE_CHART_DATA: ChartDataCollection<RangeChartData> = {
  rangeExample: {
    data: [
      { min: 10, max: 30, field: '2020' },
      { min: 20, max: 25, field: '2021' },
      { min: 15, max: 50, field: '2022' },
      { min: 30, max: 50, field: '2023' },
      { min: 25, max: 30, field: '2024' },
    ],
    config: {
      title: 'Évolution des valeurs min/max',
      series: [{ 
        data: { x: field('field'), y: rangeFields('min', 'max') },
        name: 'Plage de valeurs'
      }],
      height: 250,
      options: {
        colors: ['#4AA3A2'],
        stroke: {
          curve: 'straight',
          width: 1
        },
        fill: {
          opacity: 0.4
        },
        markers: {
          size: 3
        },
        tooltip: {
          shared: true,
          y: {
            formatter: function(val) {
              return val;
            }
          }
        },
        xaxis: {
          axisBorder: {
            show: true
          }
        },
        yaxis: {
          min: 0,
          max: 60,
          tickAmount: 4
        },
        grid: {
          borderColor: '#e0e0e0',
          strokeDashArray: 2
        }
      }
    },
  },
};