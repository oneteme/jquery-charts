import { field, XaxisType } from '@oneteme/jquery-core';
import { ChartData } from '../core/models/chart.model';

export const FUNNEL_CHART_DATA: {
  [key: string]: ChartData<XaxisType, number>;
} = {
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
