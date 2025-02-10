import { field, rangeFields, XaxisType } from '@oneteme/jquery-core';
import { ChartData } from '../core/models/chart.model';

export const RANGE_CHART_DATA: {
  [key: string]: ChartData<XaxisType, number[]>;
} = {
  rangeExample: {
    data: [
      { min: 10, max: 30, field: '2020' },
      { min: 20, max: 25, field: '2021' },
      { min: 15, max: 50, field: '2022' },
      { min: 30, max: 50, field: '2023' },
      { min: 25, max: 30, field: '2024' },
    ],
    config: {
      series: [{ data: { x: field('field'), y: rangeFields('min', 'max') } }],
      height: 250,
    },
  },
};
