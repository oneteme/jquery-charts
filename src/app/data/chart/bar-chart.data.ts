import { field, joinFields } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  BarChartData,
} from '../../core/models/chart.model';

export const BAR_CHART_DATA: ChartDataCollection<BarChartData> = {
  barExample: {
    data: [
      { palier: 'P1 Critique', COUNT: 42 },
      { palier: 'P2 Élevé', COUNT: 68 },
      { palier: 'P3 Moyen', COUNT: 96 },
      { palier: 'P4 Faible', COUNT: 124 },
    ],
    config: {
      title: 'Volumes de tickets par priorité',
      subtitle: 'Centre de support - 30 derniers jours',
      series: [
        {
          data: { x: field('palier'), y: field('COUNT') },
          name: 'Opérations',
        },
      ],
      height: 250,
      showToolbar: true,
      options: {
        plotOptions: {
          series: {
            colorByPoint: true,
            borderRadius: 4,
            dataLabels: {
              enabled: true,
            },
          },
        },
        xAxis: {
          labels: { enabled: false },
          lineWidth: 0,
          tickLength: 0,
        },
        yAxis: {
          title: { text: null },
        },
        legend: { enabled: false },
      },
    },
  },

  barExample2: {
    data: [
      { count: 110, field: '2xx' },
      { count: 160, field: '4xx' },
      { count: 80, field: '5xx' },
    ],
    config: {
      title: 'Distribution des réponses HTTP',
      subtitle: 'Applications critiques',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: "Nombre d'appels",
        },
      ],
      height: 250,
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE', '#A7E0E0', '#4AA3A2'],
        plotOptions: {
          series: {
            borderRadius: 8,
            pointPadding: 0.1,
            groupPadding: 0.1,
            dataLabels: {
              enabled: true,
              format: '{point.y}',
            },
          },
        },
        legend: {
          enabled: false,
        },
        tooltip: {
          pointFormat: '<b>{point.y} requêtes</b>',
        },
      },
    },
  },

  barExample3: {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
    ],
    config: {
      title: 'Répartition par API et statut',
      subtitle: 'Observabilité - Production',
      series: [
        {
          data: { x: joinFields('_', 'field', 'subField'), y: field('count') },
        },
      ],
      height: 250,
      options: {
        colors: [
          '#137C8B',
          '#709CA7',
          '#B8CBD0',
          '#7A90A4',
          '#344D59',
          '#80586D',
        ],
        plotOptions: {
          series: {
            borderRadius: 4,
            pointPadding: 0.1,
            groupPadding: 0.1,
            dataLabels: { enabled: false },
          },
        },
        xAxis: {
          labels: {
            rotate: -45,
            style: {
              fontSize: '11px',
            },
          },
        },
        yAxis: {
          title: {
            text: "Nombre d'appels",
          },
        },
        legend: {
          enabled: false,
        },
        tooltip: {
          pointFormat: '<b>{point.y} appels</b>',
        },
      },
    },
  },

  barExample4: {
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
      title: 'Volumes par API et classe de statut',
      subtitle: 'Vue multi-séries',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      height: 250,
    },
  },

  barExample5: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Comparaison des APIs',
      subtitle: 'Répartition 2xx / 4xx / 5xx',
      series: [
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: 'Succès (2xx)',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: 'Erreur client (4xx)',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: 'Erreur serveur (5xx)',
        },
      ],
      height: 250,
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE'],
        plotOptions: {
          series: {
            borderRadius: 5,
            stacking: 'normal',
            dataLabels: { enabled: false },
          },
        },
        yAxis: {
          title: {
            text: 'APIs',
          },
        },
        legend: {
          align: 'right',
          verticalAlign: 'top',
        },
        tooltip: {
          shared: true,
          pointFormat: '<b>{point.y} requêtes</b>',
        },
      },
    },
  },

  barExample6: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'APIs triées (ordre croissant)',
      subtitle: 'Top volumes 2xx/4xx/5xx',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      xorder: 'asc',
      options: {
        colors: ['#4CAF50', '#FF9800', '#F44336'],
        plotOptions: {
          series: { borderRadius: 4, dataLabels: { enabled: false } },
        },
        legend: {
          align: 'center',
          verticalAlign: 'top',
        },
      },
    },
  },

  barExample7: {
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
      height: 250,
      xorder: 'desc',
    },
  },

  barExample8: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Mode continu',
      subtitle: 'Données en coordonnées',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      showToolbar: true,
      continue: true,
      options: {
        colors: ['#137C8B', '#709CA7', '#B8CBD0'],
        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
              format: '{point.y}',
            },
          },
        },
        xAxis: { type: 'category' },
        tooltip: {
          shared: true,
          intersect: false,
        },
      },
    },
  },

  barExample9: {
    data: [
      { day: '1', status: 200, count: 14, group: '2xx' },
      { day: '1', status: 202, count: 5, group: '2xx' },
      { day: '1', status: 400, count: 25, group: '4xx' },
      { day: '1', status: 404, count: 19, group: '4xx' },
      { day: '1', status: 500, count: 2, group: '5xx' },
      { day: '3', status: 200, count: 10, group: '2xx' },
      { day: '3', status: 202, count: 15, group: '2xx' },
      { day: '3', status: 400, count: 7, group: '4xx' },
      { day: '3', status: 404, count: 9, group: '4xx' },
      { day: '3', status: 500, count: 12, group: '5xx' },
    ],
    config: {
      title: 'Empilement par statut HTTP',
      subtitle: 'Comparaison par jour',
      series: [
        {
          data: { x: field('day'), y: field('count') },
          name: (o, i) => `st-${o['status']}`,
          stack: field('group'),
        },
      ],
      options: {
        colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
        plotOptions: {
          series: {
            stacking: 'normal',
          },
        },
      },
      height: 250,
      stacked: true,
    },
  },
};
