import { field, values, joinFields } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  PieChartData,
} from '../../core/models/chart.model';

export const PIE_CHART_DATA: ChartDataCollection<PieChartData> = {
  pieExample: {
    data: [{ count_2xx: 110, count_4xx: 160, count_5xx: 80 }],
    config: {
      showToolbar: true,
      series: [
        {
          data: { x: values('2xx'), y: field('count_2xx') },
          name: 'Mapper 1',
          color: '#93441A',
        },
        {
          data: { x: values('4xx'), y: field('count_4xx') },
          name: 'Mapper 2',
          color: '#B67332',
        },
        {
          data: { x: values('5xx'), y: field('count_5xx') },
          name: 'Mapper 3',
          color: '#DAAB3A',
        },
      ],
      height: 250,
    },
  },
  pieExample2: {
    data: [
      { count: 100, field: '2xx' },
      { count: 60, field: '4xx' },
      { count: 80, field: '5xx' },
      { count: 70, field: '9xx' },
      { count: 40, field: '3xx' },
    ],
    config: {
      height: 250,
      title: 'Distribution des codes HTTP',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: "Nombre d'appels",
        },
      ],
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE', '#A7E0E0', '#4AA3A2'],
        chart: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 1,
            blur: 5,
            opacity: 0.1
          }
        },
        stroke: {
          width: 2,
          colors: ['#ffffff']
        },
        dataLabels: {
          enabled: true,
          formatter: function(val, opts) {
            const label = opts.w.globals.labels[opts.seriesIndex];
            return `${label}: ${val.toFixed(0)}%`;
          },
          style: {
            fontSize: '11px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: ['#ffffff']
          },
          background: {
            enabled: true,
            foreColor: '#333333',
            borderRadius: 2,
            padding: 4,
            opacity: 0.7,
            borderWidth: 1,
            borderColor: '#ffffff'
          },
          dropShadow: {
            enabled: false,
            top: 1,
            left: 1,
            blur: 1,
            opacity: 0.4
          }
        },
        plotOptions: {
          pie: {
            customScale: 0.9,
            offsetX: 0,
            offsetY: 0,
            expandOnClick: true,
            startAngle: 45,
            endAngle: 405,
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          horizontalAlign: 'center',
          fontSize: '12px',
          labels: {
            colors: undefined
          },
          markers: {
            width: 12,
            height: 12,
            strokeWidth: 5,
            strokeColor: '#fff',
            radius: 12
          },
          itemMargin: {
            horizontal: 10,
            vertical: 5
          }
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          style: {
            fontSize: '12px'
          },
          y: {
            title: {
              formatter: function() {
                return 'Nombre de requêtes:';
              }
            },
            formatter: function(value: any | number) {
              return value + ' requêtes (' + ((value / 410) * 100).toFixed(1) + '%)';
            }
          }
        },
      }
    }
  },

  pieExample3: {
    data: [
      { valeur: 35, categorie: 'Produit A', region: 'Nord' },
      { valeur: 25, categorie: 'Produit B', region: 'Est' },
      { valeur: 15, categorie: 'Produit C', region: 'Sud' },
      { valeur: 40, categorie: 'Produit A', region: 'Ouest' },
      { valeur: 30, categorie: 'Produit B', region: 'Nord' },
      { valeur: 20, categorie: 'Produit C', region: 'Nord' },
    ],
    config: {
      height: 250,
      title: 'Répartition des ventes par produit',
      subtitle: 'Analyse trimestrielle',
      series: [
        {
          data: {
            x: joinFields(' - ', 'categorie', 'region'),
            y: field('valeur'),
          },
          name: field('categorie'),
        },
      ],
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
          position: 'right',
          fontSize: '11px',
          offsetY: 40,
          itemMargin: {
            horizontal: 5,
            vertical: 8,
          },
        },
        tooltip: {
          enabled: true,
        },
        dataLabels: {
          enabled: false,
        },
        plotOptions: {
          pie: {
            customScale: 0.9,
            offsetX: -25,
            offsetY: 20,
            expandOnClick: false,
          },
        },
      },
    },
  },

  pieExample4: {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
    ],
    config: {
      series: [
        {
          data: { x: joinFields('_', 'field', 'subField'), y: field('count') },
        },
      ],
      options: {
        colors: [
          '#137C8B',
          '#709CA7',
          '#B8CBD0',
          '#7A90A4',
          '#344D59',
          '#80586D',
        ],
      },
    },
  },

  pieExample5: {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
    },
  },

  pieExample6: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
    },
  },

  pieExample7: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      xorder: 'asc',
    },
  },

  pieExample8: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      xorder: 'desc',
    },
  },

  pieExample9: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      continue: true,
    },
  },
};
