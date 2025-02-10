import { field, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartData } from '../core/models/chart.model';

export const HEATMAP_CHART_DATA: {
  [key: string]: ChartData<XaxisType, YaxisType>;
} = {
  heatmapExample: {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABC', categ: 'Mobile' },
      { count: 10, field: 'DEF', categ: 'Mobile' },
      { count: 31, field: 'XYZ', categ: 'Mobile' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('categ'),
        },
      ],
      height: 250,
    },
  },
};
