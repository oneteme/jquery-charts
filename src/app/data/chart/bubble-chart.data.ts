import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, BubbleChartData } from '../../core/models/chart.model';

export const BUBBLE_CHART_DATA: ChartDataCollection<BubbleChartData> = {
  bubbleExample: {
    data: [
      { product: 'Suite CRM', revenue: 4.2, growth: 18, customers: 380 },
      { product: 'Analytics', revenue: 3.1, growth: 24, customers: 260 },
      { product: 'Support Pro', revenue: 2.4, growth: 12, customers: 410 },
      { product: 'Marketing AI', revenue: 1.8, growth: 34, customers: 190 },
      { product: 'Data Hub', revenue: 2.9, growth: 20, customers: 240 },
    ],
    config: {
      title: 'Portefeuille produits',
      subtitle: 'Revenu vs croissance (taille = clients)',
      xtitle: 'Revenu annuel (M€)',
      ytitle: 'Croissance (%)',
      continue: true,
      height: 320,
      showToolbar: true,
      series: [
        {
          data: {
            x: field('revenue'),
            y: field('growth'),
            z: field('customers') as any,
          } as any,
          name: field('product'),
        },
      ],
      options: {
        chart: { zoomType: 'xy' },
        plotOptions: {
          series: {
            minSize: 10,
            maxSize: 50,
          },
        },
        tooltip: {
          pointFormatter: function () {
            const point: any = this as any;
            return `<b>${point.series?.name || 'Produit'}</b><br/>Revenu: ${point.x} M€<br/>Croissance: ${point.y}%<br/>Clients: ${point.z}`;
          },
        },
        xAxis: { title: { text: 'Revenu (M€)' } },
        yAxis: { title: { text: 'Croissance (%)' } },
        legend: { enabled: false },
      },
    },
  },
};
