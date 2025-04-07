import { field, joinFields } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  BarChartData,
} from '../../core/models/chart.model';

export const BAR_CHART_DATA: ChartDataCollection<BarChartData> = {
  barExample: {
    data: [
      { palier: 'Niveau 1', COUNT: 110 },
      { palier: 'Niveau 2', COUNT: 160 },
      { palier: 'Niveau 3', COUNT: 80 },
      { palier: 'Niveau 4', COUNT: 145 }
    ],
    config: {
      title: 'title test',
      series: [
        {
          data: { x: field('palier'), y: field('COUNT') },
          name: 'Opérations',
        },
      ],
      height: 250,
      showToolbar: true,
      options: {
        dataLabels: {
          dropShadow: {
            enabled: true,
          },
          enabled: true,
        },
        title: {
          align: 'center',
          style: {
            color: '#333',
            fontSize: '16px',
            fontWeight: 700,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            distributed: true,
          },
        },
        yaxis: { show: true },
        xaxis: {
          show: false,
          labels: { show: false },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        legend: { horizontalAlign: 'left', offsetX: 20 },
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
      title: 'Distribution par code HTTP',
      subtitle: 'Analyse des statuts de réponse',
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
          bar: {
            borderRadius: 8,
            columnWidth: '60%',
            dataLabels: {
              position: 'top',
            },
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val;
          },
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: ['#333'],
          },
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        legend: {
          show: false,
        },
        grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'],
            opacity: 0.5,
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
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
      title: 'Distribution par API et code',
      subtitle: 'Analyse croisée API/statut',
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
          bar: {
            horizontal: false,
            columnWidth: '70%',
            borderRadius: 4,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          labels: {
            rotate: -45,
            style: {
              fontSize: '11px',
            },
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
          },
        },
        fill: {
          opacity: 0.9,
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.2,
            gradientToColors: undefined,
            inverseColors: true,
            opacityFrom: 0.9,
            opacityTo: 0.7,
            stops: [0, 90, 100],
          },
        },
        legend: {
          show: false,
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val + ' appels';
            },
          },
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
      subtitle: 'Vue par type de code HTTP',
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
        chart: {
          stacked: true,
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '80%',
            borderRadius: 5,
          },
        },
        stroke: {
          width: 1,
          colors: ['#fff'],
        },
        xaxis: {
          categories: ['Api 1', 'Api 2', 'Api 3'],
        },
        yaxis: {
          title: {
            text: 'APIs',
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
        },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
        },
        fill: {
          opacity: 1,
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
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      xorder: 'asc',
      options: {
        colors: ['#4CAF50', '#FF9800', '#F44336'],
        chart: {
          dropShadow: {
            enabled: true,
            opacity: 0.4,
          },
        },
        dataLabels: {
          enabled: false,
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
          },
        },
        legend: {
          position: 'top',
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
      subtitle: 'Affichage en coordonnées',
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
        markers: {
          size: 5,
          hover: {
            size: 7,
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -10,
          style: {
            fontSize: '12px',
            colors: ['#333'],
          },
        },
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        xaxis: {
          type: 'category',
        },
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
      series: [
        {
          data: { x: field('day'), y: field('count') },
          name: (o, i) => `st-${o['status']}`,
          stack: field('group'),
        },
      ],
      options: {
        colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
      },
      height: 250,
      stacked: true,
    },
  },
};
