import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, PolarChartData, RadarChartData, RadialBarChartData } from '../../core/models/chart.model';

export const POLAR_CHART_DATA: ChartDataCollection<PolarChartData> = {
  polarExample: {
    data: [
      { axis: 'Qualité', value: 82, team: 'Produit' },
      { axis: 'Livraison', value: 74, team: 'Produit' },
      { axis: 'Support', value: 88, team: 'Produit' },
      { axis: 'Sécurité', value: 79, team: 'Produit' },
      { axis: 'Performance', value: 85, team: 'Produit' },
      { axis: 'Qualité', value: 76, team: 'Service' },
      { axis: 'Livraison', value: 81, team: 'Service' },
      { axis: 'Support', value: 92, team: 'Service' },
      { axis: 'Sécurité', value: 83, team: 'Service' },
      { axis: 'Performance', value: 78, team: 'Service' },
    ],
    config: {
      title: 'Indice de performance par domaine',
      subtitle: 'Comparaison Produit vs Service',
      height: 360,
      showToolbar: true,
      series: [
        {
          data: { x: field('axis'), y: field('value') },
          name: field('team'),
        },
      ],
      options: {
        plotOptions: {
          series: { pointPadding: 0.1, groupPadding: 0.1 },
        },
        yAxis: { max: 100, tickInterval: 20 },
        legend: { align: 'center', verticalAlign: 'bottom' },
      },
    },
  },
};

export const RADAR_CHART_DATA: ChartDataCollection<RadarChartData> = {
  radarExample: {
    data: [
      { axis: 'Qualité', value: 78, team: 'Plateforme' },
      { axis: 'Livraison', value: 70, team: 'Plateforme' },
      { axis: 'Support', value: 83, team: 'Plateforme' },
      { axis: 'Sécurité', value: 86, team: 'Plateforme' },
      { axis: 'Performance', value: 80, team: 'Plateforme' },
      { axis: 'Qualité', value: 72, team: 'Ops' },
      { axis: 'Livraison', value: 78, team: 'Ops' },
      { axis: 'Support', value: 88, team: 'Ops' },
      { axis: 'Sécurité', value: 90, team: 'Ops' },
      { axis: 'Performance', value: 76, team: 'Ops' },
    ],
    config: {
      title: 'Radar de maturité opérationnelle',
      subtitle: 'Plateforme vs Ops',
      height: 360,
      showToolbar: true,
      series: [
        {
          data: { x: field('axis'), y: field('value') },
          name: field('team'),
        },
      ],
      options: {
        yAxis: { max: 100, tickInterval: 20 },
        legend: { align: 'center', verticalAlign: 'bottom' },
      },
    },
  },
};

export const RADIAL_BAR_CHART_DATA: ChartDataCollection<RadialBarChartData> = {
  radialBarExample: {
    data: [
      { axis: 'SLA', value: 92 },
      { axis: 'Disponibilité', value: 97 },
      { axis: 'Latence', value: 88 },
      { axis: 'Sécurité', value: 94 },
    ],
    config: {
      title: 'Scores de conformité',
      subtitle: 'SLA & performance plateforme',
      height: 360,
      showToolbar: true,
      series: [
        {
          data: { x: field('axis'), y: field('value') },
          name: 'Score',
        },
      ],
      options: {
        colors: ['#2563EB', '#7C3AED', '#10B981', '#F59E0B'],
        pane: {
          startAngle: 0,
          endAngle: 270,
        },
        xAxis: {
          labels: {
            step: 1,
          },
        },
        yAxis: {
          max: 100,
          labels: { enabled: false },
        },
        plotOptions: {
          series: {
            borderRadius: 999,
            colorByPoint: true,
          },
        },
        radialBar: {
          track: { enabled: true, color: '#E5E7EB' },
          centerValue: { enabled: true, fontSize: '18px', fontWeight: '700' },
        },
        legend: { enabled: false },
      },
    },
  },
};
