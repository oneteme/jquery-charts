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
        chart: {
          type: 'bar',
          animations: {
            enabled: true,
            speed: 500,
            animateGradually: {
              enabled: true,
              delay: 150,
            },
          },
        },
        plotOptions: {
          bar: {
            borderRadius: 2,
            horizontal: true,
            distributed: true,
            barHeight: '80%',
            isFunnel: true,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val, opt) {
            return (
              opt.w.globals.labels[opt.dataPointIndex] +
              ': ' +
              val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
            );
          },
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            colors: ['#fff'],
          },
          background: {
            enabled: false,
          },
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 1,
            opacity: 0.4,
          },
        },
        title: {
          text: "Tunnel d'achat e-commerce",
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
          },
        },
        subtitle: {
          text: 'Taux de conversion global: 10%',
          align: 'center',
          style: {
            fontSize: '14px',
            fontWeight: 'normal',
          },
        },
        xaxis: {
          categories: [
            'Visites',
            'Paniers',
            'Checkout',
            'Paiement',
            'Livraison',
          ],
          labels: {
            show: false,
          },
        },
        yaxis: {
          labels: {
            show: false
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
          crosshairs: {
            show: false
          },
          tooltip: {
            enabled: false
          }
        },
        legend: {
          show: false,
        },
        grid: {
          show: false,
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            const correctIndex =
              FUNNEL_CHART_DATA.funnelExample.data.length - 1 - dataPointIndex;

            const data = FUNNEL_CHART_DATA.funnelExample.data[correctIndex];

            let prevValue =
              correctIndex > 0
                ? FUNNEL_CHART_DATA.funnelExample.data[correctIndex - 1].count
                : null;

            let conversionRate = prevValue
              ? ((data.count / prevValue) * 100).toFixed(1) + '%'
              : '100%';

            const formattedCount = data.count
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

            return `<div style="padding: 10px; background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
              <span style="font-weight: bold; color: ${
                w.globals.colors[dataPointIndex]
              };">
                ${data.field}
              </span>
              <div style="margin: 5px 0; font-size: 13px;">${
                data.description
              }</div>
              <div style="font-size: 12px;">
                <span style="display: block; margin-bottom: 3px;">
                  <strong>${formattedCount}</strong> visiteurs
                </span>
                ${
                  prevValue
                    ? `<span style="display: block;">
                    Taux de conversion: <strong>${conversionRate}</strong>
                  </span>`
                    : ''
                }
              </div>
            </div>`;
          },
        },
      },
    },
  },
};
