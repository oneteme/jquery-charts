import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, TreemapChartData } from '../../core/models/chart.model';

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
      title: 'Répartition des valeurs',
      subtitle: 'Distribution de base',
      series: [{ data: { x: field('field'), y: field('count') } }],
      height: 250,
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE', '#A7E0E0', '#4AA3A2'],
        legend: {
          enabled: false,
        },
        plotOptions: {
          series: {
            layoutAlgorithm: 'squarified',
            allowTraversingTree: true,
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.value}',
            },
          },
        },
        tooltip: {
          pointFormat: '<b>{point.value} éléments</b>',
        },
      },
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
      title: 'Répartition par catégorie',
      subtitle: 'Analyse des appareils',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('categ'),
        },
      ],
      height: 250,
      options: {
        colors: [
          '#77021D',
          '#F6B339',
          '#DA7B27',
          '#D7572B',
          '#C23028',
          '#EA5863',
        ],
        legend: {
          align: 'center',
          verticalAlign: 'bottom',
        },
        plotOptions: {
          series: {
            layoutAlgorithm: 'squarified',
            allowTraversingTree: true,
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.value}',
            },
          },
        },
        tooltip: {
          pointFormat: '<b>{point.value} unités</b>',
        },
      },
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
      options: {
        colors: [
          '#8E44AD',
          '#16A085',
          '#F39C12',
          '#2980B9',
          '#C0392B',
          '#27AE60',
          '#F27438',
          '#A7001E',
          '#E1A624',
        ],
        legend: {
          align: 'right',
          verticalAlign: 'top',
        },
        plotOptions: {
          series: {
            layoutAlgorithm: 'squarified',
            allowTraversingTree: true,
            dataLabels: {
              enabled: true,
              format: '{point.value}',
            },
          },
        },
        tooltip: {
          pointFormat: '<b>{point.value} éléments</b>',
        },
      },
    },
  },
};
