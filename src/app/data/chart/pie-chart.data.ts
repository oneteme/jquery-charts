import { field, values, joinFields } from '@oneteme/jquery-core';
import { ChartDataCollection, PieChartData } from '../../core/models/chart.model';

export const PIE_CHART_DATA: ChartDataCollection<PieChartData> = {
  donutExample: {
    data: [
      { segment: 'Enterprise', value: 42 },
      { segment: 'Mid-market', value: 28 },
      { segment: 'SMB', value: 18 },
      { segment: 'Public', value: 12 },
    ],
    config: {
      title: 'Mix de revenus récurrents',
      subtitle: 'Répartition par segment client',
      height: 280,
      showToolbar: true,
      series: [
        {
          data: { x: field('segment'), y: field('value') },
          name: 'MRR',
        },
      ],
      options: {
        colors: ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD'],
        plotOptions: {
          series: {
            innerSize: '65%',
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.1f}%'
            },
            showInLegend: true,
          },
        },
        donutCenter: {
          enabled: true,
          title: 'MRR',
          labelColor: '#475569',
          valueColor: '#0F172A',
          labelFontSize: '12px',
          valueFontSize: '20px',
        },
        tooltip: {
          pointFormat: '<b>{point.y}%</b> du MRR',
        },
        legend: { align: 'center', verticalAlign: 'bottom' },
      },
    },
  },
  pieExample: {
    data: [{ count_2xx: 110, count_4xx: 160, count_5xx: 80 }],
    config: {
      title: 'Qualité de service API',
      subtitle: 'Répartition par classe de statut',
      showToolbar: true,
      height: 250,
      series: [
        {
          data: { x: values('2xx'), y: field('count_2xx') },
          name: 'Succès',
          color: '#93441A',
        },
        {
          data: { x: values('4xx'), y: field('count_4xx') },
          name: 'Erreurs client',
          color: '#B67332',
        },
        {
          data: { x: values('5xx'), y: field('count_5xx') },
          name: 'Erreurs serveur',
          color: '#DAAB3A',
        },
      ],
      options: {
        plotOptions: {
          series: {
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.y}'
            },
            showInLegend: true,
          },
        },
        tooltip: {
          pointFormat: '<b>{point.y}</b> requêtes',
        },
        legend: { align: 'right', verticalAlign: 'middle', layout: 'vertical' },
      },
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
      subtitle: 'Trafic global (prod)',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: "Nombre d'appels",
        },
      ],
      options: {
        colors: ['#0EA5E9', '#F97316', '#EF4444', '#A855F7', '#22C55E'],
        plotOptions: {
          series: {
            allowPointSelect: true,
            cursor: 'pointer',
            borderWidth: 2,
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.1f}%'
            },
            showInLegend: true,
          },
        },
        legend: {
          align: 'center',
          verticalAlign: 'bottom',
        },
        tooltip: {
          pointFormat: '<b>{point.y} requêtes</b> ({point.percentage:.1f}%)',
        },
      },
    },
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
      subtitle: 'Segmentation régionale',
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
        colors: ['#0F766E', '#14B8A6', '#5EEAD4', '#0EA5E9', '#6366F1', '#A855F7'],
        plotOptions: {
          series: {
            dataLabels: { enabled: false },
            showInLegend: true,
          },
        },
        legend: {
          align: 'right',
          verticalAlign: 'middle',
          layout: 'vertical',
        },
        tooltip: {
          pointFormat: '<b>{point.y} k€</b>',
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
      title: 'Répartition des appels par API',
      subtitle: 'Vue par segment de statut',
      series: [
        {
          data: { x: joinFields('_', 'field', 'subField'), y: field('count') },
        },
      ],
      options: {
        colors: ['#2563EB', '#60A5FA', '#F97316', '#FDBA74', '#22C55E', '#86EFAC'],
        plotOptions: {
          series: {
            showInLegend: true,
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.0f}%'
            },
          },
        },
        legend: { align: 'center', verticalAlign: 'bottom' },
        tooltip: { pointFormat: '<b>{point.y}</b> appels' },
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
      title: 'Volumes par API et statut',
      subtitle: 'Agrégation multi-séries',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      options: {
        colors: ['#4F46E5', '#F59E0B', '#EF4444'],
        plotOptions: {
          series: {
            dataLabels: { enabled: false },
            showInLegend: true,
          },
        },
        legend: { align: 'right', verticalAlign: 'middle', layout: 'vertical' },
        tooltip: { pointFormat: '<b>{point.y}</b> appels' },
      },
    },
  },
};
