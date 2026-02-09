import { field, joinFields } from '@oneteme/jquery-core';
import { ChartDataCollection, LineChartData } from '../../core/models/chart.model';

export const LINE_CHART_DATA: ChartDataCollection<LineChartData> = {
  lineExample: {
    data: [
      { date: '01-2023', count_2xx: 110, count_4xx: 90, count_5xx: 30 },
      { date: '02-2023', count_2xx: 125, count_4xx: 65, count_5xx: 45 },
      { date: '03-2023', count_2xx: 150, count_4xx: 80, count_5xx: 60 },
      { date: '04-2023', count_2xx: 160, count_4xx: 100, count_5xx: 40 },
      { date: '05-2023', count_2xx: 180, count_4xx: 110, count_5xx: 20 },
    ],
    config: {
      title: 'Évolution des codes HTTP',
      subtitle: 'Tendance sur 5 mois',
      showToolbar: true,
      series: [
        {
          data: { x: field('date'), y: field('count_2xx') },
          name: 'Succès',
          color: '#4CAF50',
        },
        {
          data: { x: field('date'), y: field('count_4xx') },
          name: 'Erreur client',
          color: '#FF9800',
        },
        {
          data: { x: field('date'), y: field('count_5xx') },
          name: 'Erreur serveur',
          color: '#F44336',
        },
      ],
      height: 250,
      options: {
        colors: ['#4CAF50', '#FF9800', '#F44336'],
        chart: {
          zoomType: 'x',
        },
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: {
          title: { text: null },
          tickInterval: 1,
        },
        yAxis: {
          title: { text: "Nombre d'appels" },
          min: 0,
          tickAmount: 6,
          maxOffset: 25,
          maxRounding: 10,
          smallMaxThreshold: 50,
          smallMaxTickCount: 4,
          smallMaxMinTickInterval: 1,
        },
        tooltip: {
          shared: true,
          valueSuffix: ' requêtes',
        },
        legend: {
          align: 'right',
          verticalAlign: 'top',
        },
      },
    },
  },

  lineExample2: {
    data: [
      { count: 110, field: '2xx' },
      { count: 160, field: '4xx' },
      { count: 80, field: '5xx' },
    ],
    config: {
      title: 'Trafic par statut',
      subtitle: 'Vue synthétique',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: "Nombre d'appels",
          color: '#CA3C66',
        },
      ],
      height: 250,
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE'],
        chart: { zoomType: 'x' },
        plotOptions: {
          series: {
            lineWidth: 4,
            marker: { enabled: true, radius: 5 },
            dataLabels: { enabled: true, format: '{point.y}' },
          },
        },
        tooltip: { pointFormat: '<b>{point.y} requêtes</b>' },
      },
    },
  },

  lineExample3: {
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
      title: 'Tendance par statut HTTP',
      subtitle: 'Comparaison par API',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      height: 250,
      options: {
        colors: ['#77021D', '#F6B339', '#DA7B27'],
        chart: { zoomType: 'x' },
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: { title: { text: 'APIs' } },
        yAxis: { title: { text: "Nombre d'appels" }, min: 0, max: 100 },
        tooltip: { shared: true, valueSuffix: ' requêtes' },
        legend: { align: 'right', verticalAlign: 'top' },
      },
    },
  },

  lineExample4: {
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
      title: 'Analyse croisée API/Statut',
      subtitle: 'Segmentations détaillées',
      series: [
        {
          data: { x: joinFields('_', 'field', 'subField'), y: field('count') },
          name: 'Appels API',
        },
      ],
      height: 250,
      options: {
        colors: ['#137C8B'],
        plotOptions: {
          series: {
            dataLabels: { enabled: true, format: '{point.y}' },
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: {
          labels: { rotation: -45 },
          title: { text: 'API et code' },
        },
        yAxis: {
          title: { text: "Nombre d'appels" },
          min: 0,
        },
        tooltip: { pointFormat: '<b>{point.y} requêtes</b>' },
      },
    },
  },

  lineExample5: {
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
      title: 'Regroupement par statut HTTP',
      subtitle: 'Analyse des tendances par API',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      height: 250,
      options: {
        colors: ['#77021D', '#F6B339', '#DA7B27'],
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
            dataLabels: { enabled: true, format: '{point.y}' },
          },
        },
        xAxis: { title: { text: 'APIs' } },
        yAxis: {
          title: { text: "Nombre d'appels" },
          min: 0,
          max: 100,
          tickAmount: 5,
        },
        tooltip: { shared: true, valueSuffix: ' requêtes' },
        legend: { align: 'right', verticalAlign: 'top' },
      },
    },
  },

  lineExample6: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Vue par API',
      subtitle: 'Comparaison des statuts',
      series: [
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: 'Succès (2xx)',
          color: '#4CAF50',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: 'Erreur client (4xx)',
          color: '#FF9800',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: 'Erreur serveur (5xx)',
          color: '#F44336',
        },
      ],
      height: 250,
      options: {
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: { title: { text: 'APIs' } },
        yAxis: { title: { text: "Nombre d'appels" } },
        tooltip: { shared: true, valueSuffix: ' requêtes' },
      },
    },
  },

  lineExample7: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Données empilées',
      subtitle: 'Visualisation des proportions',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      stacked: true,
      xorder: 'asc',
      options: {
        colors: [
          '#8E44AD',
          '#16A085',
          '#F39C12',
          '#2980B9',
          '#C0392B',
          '#27AE60',
        ],
        plotOptions: {
          series: {
            stacking: 'normal',
            dataLabels: { enabled: true, format: '{point.y}' },
          },
        },
        xAxis: { title: { text: 'APIs (triées)' } },
        yAxis: { title: { text: 'Requêtes cumulées' } },
        legend: { align: 'right', verticalAlign: 'top' },
        tooltip: { shared: true, valueSuffix: ' requêtes' },
      },
    },
  },

  lineExample8: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: 'Succès (2xx)',
          color: '#8E44AD',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: 'Erreur client (4xx)',
          color: '#16A085',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: 'Erreur serveur (5xx)',
          color: '#F39C12',
        },
      ],
      height: 250,
      xorder: 'desc',
      options: {
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: { title: { text: 'APIs (triées)' } },
        yAxis: { title: { text: "Nombre d'appels" }, min: 0, max: 100 },
        tooltip: { shared: true, valueSuffix: ' requêtes' },
      },
    },
  },

  lineExample9: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Mode continu',
      subtitle: 'Visualisation des tendances',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      continue: true,
      options: {
        colors: ['#77021D', '#F6B339', '#DA7B27'],
        chart: { zoomType: 'x' },
        plotOptions: {
          series: { marker: { enabled: true, radius: 4 } },
        },
        tooltip: { shared: true, valueSuffix: ' requêtes' },
      },
    },
  },
};
