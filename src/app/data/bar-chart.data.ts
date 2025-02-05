import { field, values, joinFields, XaxisType } from '@oneteme/jquery-core';
import { ChartData } from '../models/chart.model';

export const BAR_CHART_DATA: { [key: string]: ChartData<string, number> | ChartData<XaxisType, number> } = {
  barExample: {
    data: [{ count_2xx: 110, count_4xx: 160, count_5xx: 80 }],
    config: {
      series: [
        {
          data: { x: values('2xx'), y: field('count_2xx') },
          name: "Nombre d'appels",
        },
        {
          data: { x: values('4xx'), y: field('count_4xx') },
          name: "Nombre d'appels",
        },
        {
          data: { x: values('5xx'), y: field('count_5xx') },
          name: "Nombre d'appels",
        },
      ],
      height: 250,
    },
  },

  barExample2: {
    data: [
      { count: 110, field: '2xx' },
      { count: 160, field: '4xx' },
      { count: 80, field: '5xx' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: "Nombre d'appels",
        },
      ],
      height: 250,
    },
  },

  barExample3: {
    data: [],
    config: {
      series: [
        { data: { x: values('2xx'), y: values(110) } },
        { data: { x: values('4xx'), y: values(160) } },
        { data: { x: values('5xx'), y: values(80) } },
      ],
      height: 250,
    },
  },

  barExample4: {
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
      series: [
        {
          data: { x: joinFields('_', 'field', 'subField'), y: field('count') },
        },
      ],
      height: 250,
    },
  },

  barExample5: {
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
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      height: 250,
    },
  },

  barExample6: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
    },
  },

  barExample7: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      xorder: 'asc',
    },
  },

  barExample8: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      xorder: 'desc',
    },
  },

  barExample9: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      continue: true,
    },
  },

  barExample10: {
    data: [
      { day: '1', status: 200, count: 14, group: '2xx' },
      { day: '1', status: 202, count: 5, group: '2xx' },
      { day: '1', status: 400, count: 25, group: '4xx' },
      { day: '1', status: 404, count: 19, group: '4xx' },
      { day: '1', status: 500, count: 2, group: '5xx' },
      { day: '3', status: 200, count: 10, group: '2xx' },
      { day: '3', status: 202, count: 15, group: '2xx' },
      { day: '3', status: 400, count: 7, group: '4xx' },
      { day: '3', status: 404, count: 9, group: '4xx' },
      { day: '3', status: 500, count: 12, group: '5xx' },
    ],
    config: {
      series: [
        {
          data: { x: field('day'), y: field('count') },
          name: (o, i) => `st-${o['status']}`,
          stack: field('group'),
        },
      ],
      height: 250,
      stacked: true,
    },
  },
};
