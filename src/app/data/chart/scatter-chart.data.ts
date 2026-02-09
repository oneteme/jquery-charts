import { field } from '@oneteme/jquery-core';
import { ChartDataCollection, ScatterChartData } from '../../core/models/chart.model';

export const SCATTER_CHART_DATA: ChartDataCollection<ScatterChartData> = {
  scatterExample: {
    data: [
      { segment: 'Retail', spend: 12, leads: 420 },
      { segment: 'Retail', spend: 18, leads: 510 },
      { segment: 'Retail', spend: 24, leads: 640 },
      { segment: 'Enterprise', spend: 30, leads: 720 },
      { segment: 'Enterprise', spend: 38, leads: 860 },
      { segment: 'Enterprise', spend: 45, leads: 940 },
      { segment: 'SMB', spend: 6, leads: 210 },
      { segment: 'SMB', spend: 9, leads: 280 },
      { segment: 'SMB', spend: 14, leads: 360 },
    ],
    config: {
      title: 'Investissement marketing vs leads',
      subtitle: 'Comparaison par segment client (mensuel)',
      xtitle: 'Dépenses marketing (k€)',
      ytitle: 'Leads qualifiés',
      continue: true,
      height: 320,
      showToolbar: true,
      series: [
        {
          data: { x: field('spend'), y: field('leads') },
          name: field('segment'),
        },
      ],
      options: {
        chart: { zoomType: 'xy' },
        plotOptions: {
          series: {
            marker: { radius: 5, symbol: 'circle' },
          },
        },
        tooltip: {
          pointFormat: '<b>{point.x} k€</b> / {point.y} leads',
        },
        xAxis: { title: { text: 'Dépenses (k€)' } },
        yAxis: { title: { text: 'Leads' } },
        legend: { align: 'right', verticalAlign: 'top' },
      },
    },
  },
};
