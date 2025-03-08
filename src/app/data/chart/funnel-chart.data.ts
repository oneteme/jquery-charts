import { field } from '@oneteme/jquery-core';
import {
  ChartDataCollection,
  FunnelChartData,
} from '../../core/models/chart.model';

export const FUNNEL_CHART_DATA: ChartDataCollection<FunnelChartData> = {
  funnelExample: {
    data: [
      { count: 30, field: 'v1' },
      { count: 90, field: 'v2' },
      { count: 60, field: 'v3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count') }, name: 'test' },
      ],
      height: 250,
      options: {
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: true,
            distributed: true,
            barHeight: '80%',
            isFunnel: true,
          },
        },
      },
    },
  },
};
