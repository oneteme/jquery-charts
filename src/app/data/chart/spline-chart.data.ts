import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, SplineChartData } from '../../core/models/chart.model';

export const SPLINE_CHART_DATA: ChartDataCollection<SplineChartData> = {
  splineExample: {
    data: [
      { month: 'Jan', nps: 38, csat: 84 },
      { month: 'Fév', nps: 56, csat: 91 },
      { month: 'Mar', nps: 44, csat: 87 },
      { month: 'Avr', nps: 63, csat: 92 },
      { month: 'Mai', nps: 49, csat: 88 },
      { month: 'Juin', nps: 67, csat: 95 },
    ],
    config: {
      title: 'Satisfaction client',
      subtitle: 'NPS & CSAT sur 6 mois',
      height: 260,
      showToolbar: true,
      series: [
        {
          data: { x: field('month'), y: field('nps') },
          name: 'NPS',
          color: '#2563EB',
        },
        {
          data: { x: field('month'), y: field('csat') },
          name: 'CSAT',
          color: '#10B981',
        },
      ],
      options: {
        chart: { zoomType: 'x' },
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: { title: { text: null } },
        yAxis: {
          max: 100,
          title: { text: 'Score' },
        },
        tooltip: { shared: true, valueSuffix: ' pts' },
        legend: { align: 'center', verticalAlign: 'bottom' },
      },
    },
  },
  splineExample2: {
    data: [
      { month: 'Jan', revenue: 1.8, churn: 4.2 },
      { month: 'Fév', revenue: 2.4, churn: 3.6 },
      { month: 'Mar', revenue: 1.6, churn: 4.8 },
      { month: 'Avr', revenue: 2.9, churn: 3.1 },
      { month: 'Mai', revenue: 2.2, churn: 3.9 },
      { month: 'Juin', revenue: 3.1, churn: 2.8 },
    ],
    config: {
      title: 'Croissance & churn',
      subtitle: 'Double échelle',
      height: 260,
      showToolbar: true,
      series: [
        {
          data: { x: field('month'), y: field('revenue') },
          name: 'Revenus (M€)',
          color: '#0EA5E9',
        },
        {
          data: { x: field('month'), y: field('churn') },
          name: 'Churn (%)',
          color: '#F97316',
        },
      ],
      options: {
        chart: { zoomType: 'x' },
        plotOptions: {
          series: {
            lineWidth: 3,
            marker: { enabled: true, radius: 4 },
          },
        },
        xAxis: { title: { text: null } },
        yAxis: [
          {
            title: { text: 'Revenus (M€)' },
            labels: { format: '{value}M' },
          },
          {
            title: { text: 'Churn (%)' },
            labels: { format: '{value}%' },
            opposite: true,
            max: 6,
          },
        ],
        tooltip: { shared: true },
        legend: { align: 'center', verticalAlign: 'bottom' },
      },
    },
  },
};
