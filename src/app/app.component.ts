import { Component } from '@angular/core';
import {
  ChartProvider,
  XaxisType,
  YaxisType,
  buildChart,
  combineFields,
  field,
  joinFields,
  rangeFields,
  values,
} from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  pieExample: { data: any[]; config: ChartProvider<string, number> } = {
    data: [{ count_2xx: 110, count_4xx: 160, count_5xx: 80 }],
    config: {

      // Permettait de désactiver la toolbar pour un graph (avant c'etait par défaut à true dans les directives : show: true)

      // options: {
      //   chart: {
      //     toolbar: { show: false },
      //   },
      // },

      // methode simplifiée ajouter la toolbar ou non (par défaut à false comme demandé dans le fix mais voir avec Youssef. Dans les directives, si une valeur par defaut est indiquée pour showToolbar, alors show prend cette valeur sinon false)
      showToolbar: true,

      series: [
        {
          data: { x: values('2xx'), y: field('count_2xx') },
          name: 'Mapper 1',
          color: '#2E93fA',
        },
        {
          data: { x: values('4xx'), y: field('count_4xx') },
          name: 'Mapper 2',
          color: '#66DA26',
        },
        {
          data: { x: values('5xx'), y: field('count_5xx') },
          name: 'Mapper 3',
          color: '#546E7A',
        },
      ],
    },
  };

  pieExample2: { data: any[]; config: ChartProvider<string, number> } = {
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
    },
  };

  pieExample3: { data: any[]; config: ChartProvider<string, number> } = {
    data: [],
    config: {
      series: [
        { data: { x: values('2xx'), y: values(110) } },
        { data: { x: values('4xx'), y: values(160) } },
        { data: { x: values('5xx'), y: values(80) } },
      ],
    },
  };

  pieExample4: { data: any[]; config: ChartProvider<string, number> } = {
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
    },
  };

  pieExample5: { data: any[]; config: ChartProvider<string, number> } = {
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
    },
  };

  pieExample6: { data: any[]; config: ChartProvider<string, number> } = {
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
    },
  };

  pieExample7: { data: any[]; config: ChartProvider<string, number> } = {
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
      xorder: 'asc',
    },
  };

  pieExample8: { data: any[]; config: ChartProvider<string, number> } = {
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
      xorder: 'desc',
    },
  };

  pieExample9: { data: any[]; config: ChartProvider<string, number> } = {
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
      continue: true,
    },
  };

  barExample: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample2: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample3: { data: any[]; config: ChartProvider<string, number> } = {
    data: [],
    config: {
      series: [
        { data: { x: values('2xx'), y: values(110) } },
        { data: { x: values('4xx'), y: values(160) } },
        { data: { x: values('5xx'), y: values(80) } },
      ],
      height: 250,
    },
  };

  barExample4: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample5: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample6: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample7: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample8: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample9: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  barExample10: { data: any[]; config: ChartProvider<XaxisType, number> } = {
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
  };

  funnelExample: { data: any[]; config: ChartProvider<XaxisType, number> } = {
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
  };

  lineExample: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  lineExample2: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  lineExample3: { data: any[]; config: ChartProvider<string, number> } = {
    data: [],
    config: {
      series: [
        { data: { x: values('2xx'), y: values(110) } },
        { data: { x: values('4xx'), y: values(160) } },
        { data: { x: values('5xx'), y: values(80) } },
      ],
      height: 250,
    },
  };

  lineExample4: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  lineExample5: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  lineExample6: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  lineExample7: { data: any[]; config: ChartProvider<string, number> } = {
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
      stacked: true,
      xorder: 'asc',
    },
  };

  lineExample8: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  lineExample9: { data: any[]; config: ChartProvider<string, number> } = {
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
  };

  treemapExample: { data: any[]; config: ChartProvider<XaxisType, YaxisType> } =
    {
      data: [
        { count: 10, field: 'ABC' },
        { count: 30, field: 'DEF' },
        { count: 20, field: 'XYZ' },
        { count: 60, field: 'ABCD' },
        { count: 10, field: 'DEFG' },
        { count: 31, field: 'WXYZ' },
        { count: 70, field: 'PQR' },
        { count: 30, field: 'MNO' },
        { count: 44, field: 'CDE' },
      ],
      config: {
        series: [{ data: { x: field('field'), y: field('count') } }],
        height: 250,
      },
    };

  treemapExample2: {
    data: any[];
    config: ChartProvider<XaxisType, YaxisType>;
  } = {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABCD', categ: 'Mobile' },
      { count: 10, field: 'DEFG', categ: 'Mobile' },
      { count: 31, field: 'WXYZ', categ: 'Mobile' },
      { count: 70, field: 'PQR', categ: 'Mobile' },
      { count: 30, field: 'MNO', categ: 'Mobile' },
      { count: 44, field: 'CDE', categ: 'Mobile' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('categ'),
        },
      ],
      height: 250,
    },
  };

  treemapExample3: {
    data: any[];
    config: ChartProvider<XaxisType, YaxisType>;
  } = {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABCD', categ: 'Mobile' },
      { count: 10, field: 'DEFG', categ: 'Mobile' },
      { count: 31, field: 'WXYZ', categ: 'Mobile' },
      { count: 70, field: 'PQR', categ: 'Mobile' },
      { count: 30, field: 'MNO', categ: 'Mobile' },
      { count: 44, field: 'CDE', categ: 'Mobile' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('categ'),
        },
      ],
      height: 250,
      pivot: true,
    },
  };

  heatmapExample: { data: any[]; config: ChartProvider<XaxisType, YaxisType> } =
    {
      data: [
        { count: 10, field: 'ABC', categ: 'Desktops' },
        { count: 30, field: 'DEF', categ: 'Desktops' },
        { count: 20, field: 'XYZ', categ: 'Desktops' },
        { count: 60, field: 'ABC', categ: 'Mobile' },
        { count: 10, field: 'DEF', categ: 'Mobile' },
        { count: 31, field: 'XYZ', categ: 'Mobile' },
      ],
      config: {
        series: [
          {
            data: { x: field('field'), y: field('count') },
            name: field('categ'),
          },
        ],
        height: 250,
      },
    };

  rangeExample: { data: any[]; config: ChartProvider<XaxisType, number[]> } = {
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
  };

  comboExample: { data: any[]; config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        {
          data: {
            x: field('field'),
            y: combineFields(
              (args) =>
                args.reduce((acc, o) => {
                  acc += o;
                  return acc;
                }),
              ['count_2xx', 'count_4xx', 'count_5xx']
            ),
          },
          name: "Nombre d'appels",
          type: 'column',
        },
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: '2xx',
          type: 'line',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: '4xx',
          type: 'line',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: '5xx',
          type: 'line',
        },
      ],
      height: 250,
      options: {
        dataLabels: {
          enabled: true,
          enabledOnSeries: [1, 2, 3],
        },
        yaxis: [
          {
            title: {
              text: 'Website Blog',
            },
          },
          {
            opposite: true,
            title: {
              text: 'Social Media',
            },
          },
        ],
      },
    },
  };

  ngOnInit() {
    var test = buildChart(this.comboExample.data, this.comboExample.config);
    console.log(test);
  }

  ngAfterViewInit() {}
}
