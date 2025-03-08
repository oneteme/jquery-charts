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
      title: 'Répartition des valeurs',
      subtitle: 'Distribution de base',
      series: [{ data: { x: field('field'), y: field('count') } }],
      height: 250,
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE', '#A7E0E0', '#4AA3A2'],
        chart: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 1,
            blur: 5,
            opacity: 0.1,
          },
        },
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: ['#fff'],
          },
          formatter: function (text, op) {
            return `${text}: ${op.value}`;
          },
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 1,
            opacity: 0.45,
          },
        },
        plotOptions: {
          treemap: {
            distributed: true,
            enableShades: true,
            shadeIntensity: 0.5,
            reverseNegativeShade: true,
            colorScale: {
              ranges: [
                {
                  from: 0,
                  to: 20,
                  color: '#DB6A8F',
                },
                {
                  from: 21,
                  to: 40,
                  color: '#CA3C66',
                },
                {
                  from: 41,
                  to: 60,
                  color: '#A7E0E0',
                },
                {
                  from: 61,
                  to: 100,
                  color: '#4AA3A2',
                },
              ],
            },
          },
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          style: {
            fontSize: '12px',
          },
          y: {
            formatter: function (value) {
              return value + ' éléments';
            },
          },
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
          show: true,
          position: 'bottom',
          horizontalAlign: 'center',
          fontSize: '12px',
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '11px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
          },
          formatter: function (text, op) {
            return [text, op.value].join(': ');
          },
        },
        plotOptions: {
          treemap: {
            enableShades: true,
            shadeIntensity: 0.6,
            useFillColorAsStroke: true,
            colorScale: {
              inverse: false,
              ranges: [
                {
                  from: 0,
                  to: 25,
                  color: '#F6B339',
                },
                {
                  from: 26,
                  to: 50,
                  color: '#DA7B27',
                },
                {
                  from: 51,
                  to: 75,
                  color: '#77021D',
                },
              ],
            },
          },
        },
        tooltip: {
          enabled: true,
          x: {
            show: true,
            formatter: function (val) {
              return val;
            },
          },
          y: {
            title: {
              formatter: function () {
                return 'Valeur:';
              },
            },
            formatter: function (value) {
              return value + ' unités';
            },
          },
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
        ],
        chart: {
          dropShadow: {
            enabled: true,
            top: 3,
            left: 2,
            blur: 4,
            opacity: 0.2,
          },
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '12px',
          itemMargin: {
            horizontal: 8,
            vertical: 5,
          },
          markers: {
            width: 10,
            height: 10,
            strokeWidth: 0,
            radius: 2,
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
            colors: ['#fff'],
          },
          background: {
            enabled: true,
            foreColor: '#333',
            opacity: 0.7,
            borderRadius: 2,
            padding: 3,
          },
          formatter: function (text, op) {
            return op.value;
          },
        },
        plotOptions: {
          treemap: {
            distributed: false,
            enableShades: true,
            shadeIntensity: 0.4,
            reverseNegativeShade: false,
          },
        },
        tooltip: {
          theme: 'dark',
          shared: false,
          intersect: true,
          followCursor: true,
          x: {
            show: true,
          },
          y: {
            formatter: function (value) {
              return value + ' éléments';
            },
          },
        },
      },
    },
  },
};
