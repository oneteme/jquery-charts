import { field } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  TreemapChartData,
} from '../../core/models/chart.model';

export const TREEMAP_CHART_DATA: ChartDataCollection<TreemapChartData> = {
  treemapExample: {
    data: [
      { count: 10, field: 'ABC' },
      { count: 30, field: 'DEF' },
      { count: 20, field: 'XYZ' },
      { count: 60, field: 'ABCD' },
      { count: 10, field: 'DEFG' },
      { count: 31, field: 'WXYZ' },
      { count: 70, field: 'PQR' },
      { count: 30, field: 'MNO' },
      { count: 44, field: 'CDE' },
    ],
    config: {
      series: [{ data: { x: field('field'), y: field('count') } }],
      height: 250,
    },
  },

  treemapExample2: {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABCD', categ: 'Mobile' },
      { count: 10, field: 'DEFG', categ: 'Mobile' },
      { count: 31, field: 'WXYZ', categ: 'Mobile' },
      { count: 70, field: 'PQR', categ: 'Mobile' },
      { count: 30, field: 'MNO', categ: 'Mobile' },
      { count: 44, field: 'CDE', categ: 'Mobile' },
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

  treemapExample3: {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABCD', categ: 'Mobile' },
      { count: 10, field: 'DEFG', categ: 'Mobile' },
      { count: 31, field: 'WXYZ', categ: 'Mobile' },
      { count: 70, field: 'PQR', categ: 'Mobile' },
      { count: 30, field: 'MNO', categ: 'Mobile' },
      { count: 44, field: 'CDE', categ: 'Mobile' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('categ'),
        },
      ],
      height: 250,
      pivot: true,
    },
  },
};
