import { field, combineFields } from '@oneteme/jquery-core';
import { ChartDataCollection, ComboChartData } from '../../core/models/chart.model';

export const COMBO_CHART_DATA: ChartDataCollection<ComboChartData> = {
  comboExample: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        {
          data: {
            x: field('field'),
            y: combineFields(
              (args) =>
                args.reduce((acc, o) => {
                  acc += o;
                  return acc;
                }, 0),
              ['count_2xx', 'count_4xx', 'count_5xx']
            ),
          },
          name: "Nombre d'appels",
          type: 'column',
        },
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: '2xx',
          type: 'line',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: '4xx',
          type: 'line',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: '5xx',
          type: 'line',
        },
      ],
      height: 250,
      options: {
        dataLabels: {
          enabled: true,
          enabledOnSeries: [1, 2, 3],
        },
        yaxis: [
          {
            title: {
              text: 'Website Blog',
            },
          },
          {
            opposite: true,
            title: {
              text: 'Social Media',
            },
          },
        ],
      },
    },
  },
};
