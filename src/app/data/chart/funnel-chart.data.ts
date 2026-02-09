import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, FunnelChartData } from '../../core/models/chart.model';

export const FUNNEL_CHART_DATA: ChartDataCollection<FunnelChartData> = {
  funnelExample: {
    data: [
      { count: 5000, field: 'Visites', description: 'Visites sur le site' },
      { count: 2500, field: 'Paniers', description: 'Ajouts au panier' },
      { count: 1000, field: 'Checkout', description: 'Début de paiement' },
      { count: 600, field: 'Paiement', description: 'Paiements complétés' },
      { count: 500, field: 'Livraison', description: 'Commandes livrées' },
    ],
    config: {
      title: "Tunnel d'achat e-commerce",
      subtitle: 'Conversion de la visite à la livraison',
      series: [
        { data: { x: field('field'), y: field('count') }, name: 'Volume' },
      ],
      height: 350,
      showToolbar: true,
      options: {
        colors: ['#560905', '#84181C', '#B13026', '#C8574D', '#EA925E'],
        plotOptions: {
          series: {
            width: '80%',
            neckWidth: '30%',
            neckHeight: '25%',
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.y:,.0f}'
            }
          }
        },
        legend: { enabled: false },
        tooltip: {
          pointFormat: '<b>{point.y:,.0f} visiteurs</b>',
        },
      },
    },
  },
};
