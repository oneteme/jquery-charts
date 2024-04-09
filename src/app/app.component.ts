import { Component } from '@angular/core';
import { ChartProvider, XaxisType, YaxisType, field, joinFields, values } from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // pieExample: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count1: 30, count2: 70, count3: 20 }
  //   ],
  //   config: {
  //     title: 'Exemple de Pie Chart n°1',
  //     mappers: [
  //       { field: 'count1', label: 'Field 1', color: '#33cc33' },
  //       { field: 'count2', label: 'Field 2', color: '#ffa31a' },
  //       { field: 'count3', label: 'Field 3', color: '#ff0000' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // pieExample2: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 40, field: 'Field 1' },
  //     { count: 20, field: 'Field 2' },
  //     { count: 50, field: 'Field 3' },
  //     { count: 80, field: 'Field 4' }
  //   ],
  //   config: {
  //     title: 'Exemple de Pie Chart n°2',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count', label: 'Total' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // pieExample3: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 40, field: 'Field 1', subField: 'Sub Field 1' },
  //     { count: 20, field: 'Field 2', subField: 'Sub Field 1' },
  //     { count: 50, field: 'Field 3', subField: 'Sub Field 1' },
  //     { count: 80, field: 'Field 4', subField: 'Sub Field 1' }
  //   ],
  //   config: {
  //     title: 'Exemple de Pie Chart n°3',
  //     category: {
  //       type: 'string',
  //       mapper: ['field', 'subField']
  //     },
  //     mappers: [
  //       { field: 'count', label: 'Total' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // donutExample1: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count1: 30, count2: 70, count3: 20 }
  //   ],
  //   config: {
  //     title: 'Exemple de Donut Chart n°1',
  //     mappers: [
  //       { field: 'count1', label: 'Field 1', color: '#33cc33' },
  //       { field: 'count2', label: 'Field 2', color: '#ffa31a' },
  //       { field: 'count3', label: 'Field 3', color: '#ff0000' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // donutExample2: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 40, field: 'Field 1' },
  //     { count: 20, field: 'Field 2' },
  //     { count: 50, field: 'Field 3' },
  //     { count: 80, field: 'Field 4' }
  //   ],
  //   config: {
  //     title: 'Exemple de Donut Chart n°2',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count', label: 'Total' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // donutExample3: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 40, field: 'Field 1', subField: 'Sub Field 1' },
  //     { count: 20, field: 'Field 2', subField: 'Sub Field 1' },
  //     { count: 50, field: 'Field 3', subField: 'Sub Field 1' },
  //     { count: 80, field: 'Field 4', subField: 'Sub Field 1' }
  //   ],
  //   config: {
  //     title: 'Exemple de Donut Chart n°3',
  //     category: {
  //       type: 'string',
  //       mapper: ['field', 'subField']
  //     },
  //     mappers: [
  //       { field: 'count', label: 'Total' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // polarAreaExample1: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count1: 30, count2: 70, count3: 20 }
  //   ],
  //   config: {
  //     title: 'Exemple de PolarArea Chart n°1',
  //     mappers: [
  //       { field: 'count1', label: 'Field 1', color: '#33cc33' },
  //       { field: 'count2', label: 'Field 2', color: '#ffa31a' },
  //       { field: 'count3', label: 'Field 3', color: '#ff0000' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // polarAreaExample2: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 40, field: 'Field 1' },
  //     { count: 20, field: 'Field 2' },
  //     { count: 50, field: 'Field 3' },
  //     { count: 80, field: 'Field 4' }
  //   ],
  //   config: {
  //     title: 'Exemple de PolarArea Chart n°2',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // polarAreaExample3: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 40, field: 'Field 1', subField: 'Sub Field 1' },
  //     { count: 20, field: 'Field 2', subField: 'Sub Field 1' },
  //     { count: 50, field: 'Field 3', subField: 'Sub Field 1' },
  //     { count: 80, field: 'Field 4', subField: 'Sub Field 1' }
  //   ],
  //   config: {
  //     title: 'Exemple de PolarArea Chart n°3',
  //     category: {
  //       type: 'string',
  //       mapper: ['field', 'subField']
  //     },
  //     mappers: [
  //       { field: 'count' }
  //     ],
  //     options: {
  //       chart: { height: 250 }
  //     }
  //   }
  // };

  // lineExample1: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 10, field: '2020' },
  //     { count: 30, field: '2021' },
  //     { count: 20, field: '2022' },
  //     { count: 60, field: '2023' },
  //     { count: 10, field: '2024' }
  //   ],
  //   config: {
  //     title: 'Exemple de Line Chart n°1',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count', label: 'Count' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         toolbar: {
  //           show: false
  //         }
  //       }
  //     }
  //   }
  // };

  // lineExample2: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count1: 10, count2: 0, field: '2020' },
  //     { count1: 30, count2: 60, field: '2021' },
  //     { count1: 20, count2: 50, field: '2022' },
  //     { count1: 60, count2: 60, field: '2023' },
  //     { count1: 10, count2: 0, field: '2024' }
  //   ],
  //   config: {
  //     title: 'Exemple de Line Chart n°2',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count1', label: 'Sub Field 1' },
  //       { field: 'count2', label: 'Sub Field 2' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         toolbar: {
  //           show: false
  //         }
  //       },
  //       stroke: {
  //         width: 5,
  //         curve: "straight",
  //         dashArray: [0, 8, 5]
  //       }
  //     }
  //   }
  // };

  // lineExample3: { data: any[], config: ChartProvider<MultiLineChartMapper> } = {
  //   data: [
  //     { count: 10, field: '2020', subField: "Sub Field 1" },
  //     { count: 0, field: '2020', subField: "Sub Field 2" },
  //     { count: 30, field: '2021', subField: "Sub Field 1" },
  //     { count: 60, field: '2021', subField: "Sub Field 2" },
  //     { count: 20, field: '2022', subField: "Sub Field 1" },
  //     { count: 50, field: '2022', subField: "Sub Field 2" },
  //     { count: 60, field: '2023', subField: "Sub Field 1" },
  //     { count: 60, field: '2023', subField: "Sub Field 2" },
  //     { count: 10, field: '2024', subField: "Sub Field 1" },
  //     { count: 0, field: '2024', subField: "Sub Field 2" }
  //   ],
  //   config: {
  //     title: 'Exemple de Line Chart n°3',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count', multiField: 'subField' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         toolbar: {
  //           show: false
  //         }
  //       },
  //       stroke: {
  //         width: 5,
  //         curve: "straight",
  //         dashArray: [0, 8]
  //       }
  //     }
  //   }
  // };

  // areaExample1: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 10, date: '2020' },
  //     { count: 30, date: '2021' },
  //     { count: 20, date: '2022' },
  //     { count: 60, date: '2023' },
  //     { count: 10, date: '2024' }
  //   ],
  //   config: {
  //     title: 'Exemple d\'Area Chart n°1',
  //     category: {
  //       type: 'string',
  //       mapper: 'date'
  //     },
  //     mappers: [
  //       { field: 'count', label: 'Count' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         toolbar: {
  //           show: false
  //         }
  //       }
  //     }
  //   }
  // };

  // barExample1: { data: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count1: 20, count2: 10, count3: 40, field: 'Field 1' },
  //     { count1: 60, count2: 20, count3: 10, field: 'Field 2' },
  //     { count1: 10, count2: 50, count3: 20, field: 'Field 3' },
  //     { count1: 20, count2: 10, count3: 40, field: 'Field 4' },
  //   ],
  //   config: {
  //     title: 'Exemple de Bar Chart n°1',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count1', label: 'Sub Field 1' },
  //       { field: 'count2', label: 'Sub Field 2' },
  //       { field: 'count3', label: 'Sub Field 3' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         toolbar: {
  //           show: false
  //         }
  //       },
  //       stroke: {
  //         width: 1,
  //         colors: ["#fff"]
  //       }
  //     }
  //   }
  // };

  // barExample2: { data: any[], config: ChartProvider<StackedBarChartMapper> } = {
  //   data: [
  //     { count: 20, field: 'Field 1', subField: 'Sub Field 1', group: 'Group 1' },
  //     { count: 60, field: 'Field 1', subField: 'Sub Field 2', group: 'Group 1' },
  //     { count: 20, field: 'Field 1', subField: 'Sub Field 3', group: 'Group 2' },
  //     { count: 60, field: 'Field 1', subField: 'Sub Field 4', group: 'Group 2' },
  //     { count: 30, field: 'Field 2', subField: 'Sub Field 1', group: 'Group 1' },
  //     { count: 100, field: 'Field 2', subField: 'Sub Field 2', group: 'Group 1' },
  //     { count: 30, field: 'Field 2', subField: 'Sub Field 3', group: 'Group 2' },
  //     { count: 100, field: 'Field 2', subField: 'Sub Field 4', group: 'Group 2' },
  //     { count: 50, field: 'Field 3', subField: 'Sub Field 1', group: 'Group 1' },
  //     { count: 30, field: 'Field 3', subField: 'Sub Field 2', group: 'Group 1' },
  //     { count: 50, field: 'Field 3', subField: 'Sub Field 3', group: 'Group 2' },
  //     { count: 30, field: 'Field 3', subField: 'Sub Field 4', group: 'Group 2' },
  //     { count: 80, field: 'Field 4', subField: 'Sub Field 1', group: 'Group 1' },
  //     { count: 40, field: 'Field 4', subField: 'Sub Field 2', group: 'Group 1' },
  //     { count: 80, field: 'Field 4', subField: 'Sub Field 3', group: 'Group 2' },
  //     { count: 40, field: 'Field 4', subField: 'Sub Field 4', group: 'Group 2' },
  //   ],
  //   config: {
  //     title: 'Exemple de Bar Chart n°2',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count', stackField: 'subField', group: 'group' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         stacked: true,
  //         toolbar: {
  //           show: false
  //         }
  //       },
  //       stroke: {
  //         width: 1,
  //         colors: ["#fff"]
  //       }
  //     }
  //   }
  // };

  // barExample3: { data: any[], config: ChartProvider<BarChartMapper> } = {
  //   data: [
  //     { count1: 20, count2: 60, count3: 20, count4: 60, field: 'Field 1' },
  //     { count1: 30, count2: 100, count3: 30, count4: 100, field: 'Field 2' },
  //     { count1: 50, count2: 30, count3: 50, count4: 30, field: 'Field 3' },
  //     { count1: 80, count2: 40, count3: 80, count4: 40, field: 'Field 4' },
  //   ],
  //   config: {
  //     title: 'Exemple de Bar Chart n°3',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count1', label: 'Sub Field 1', group: 'group1' },
  //       { field: 'count2', label: 'Sub Field 2', group: 'group1' },
  //       { field: 'count3', label: 'Sub Field 3', group: 'group2' },
  //       { field: 'count4', label: 'Sub Field 4', group: 'group2' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250,
  //         stacked: true,
  //         toolbar: {
  //           show: false
  //         }
  //       },
  //       stroke: {
  //         width: 1,
  //         colors: ["#fff"]
  //       }
  //     }
  //   }
  // };

  // funnelExample: { data?: any[], config: ChartProvider<DataMapper> } = {
  //   data: [
  //     { count: 20, field: 'Field 1' },
  //     { count: 60, field: 'Field 2' },


  //     { count: 100, field: 'Field 3' },
  //     { count: 200, field: 'Field 4' },
  //     { count: 240, field: 'Field 5' },
  //   ],
  //   config: {
  //     title: 'Exemple de Funnel Chart n°1',
  //     category: {
  //       type: 'string',
  //       mapper: 'field'
  //     },
  //     mappers: [
  //       { field: 'count' }
  //     ],
  //     options: {
  //       chart: {
  //         height: 250
  //       },
  //       plotOptions: {
  //         bar: {
  //           borderRadius: 0,
  //           horizontal: true,
  //           distributed: true,
  //           barHeight: "80%",
  //           isFunnel: true
  //         }
  //       }
  //     }
  //   }
  // }

  pieExample: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 110, count_4xx: 160, count_5xx: 80 }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: values('2xx'), y: field('count_2xx') }, name: 'Mapper 1', color: '#2E93fA' },
        { data: { x: values('4xx'), y: field('count_4xx') }, name: 'Mapper 2', color: '#66DA26' },
        { data: { x: values('5xx'), y: field('count_5xx') }, name: 'Mapper 3', color: '#546E7A' }
      ],
      height: 250
    }
  };

  pieExample2: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count: 110, field: '2xx' },
      { count: 160, field: '4xx' },
      { count: 80, field: '5xx' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: 'Nombre d\'appels' }
      ],
      height: 250
    }
  };

  pieExample3: { data: any[], config: ChartProvider<string, number> } = {
    data: [],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: values('2xx'), y: values(110) } },
        { data: { x: values('4xx'), y: values(160) } },
        { data: { x: values('5xx'), y: values(80) } }
      ],
      height: 250
    }
  };

  pieExample4: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: joinFields('_', 'field', 'subField'), y: field('count') } }
      ],
      height: 250
    }
  };

  pieExample5: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: field('subField') }
      ],
      height: 250
    }
  };

  pieExample6: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250
    }
  };



  pieExample7: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250,
      xorder: 'asc'
    }
  };

  pieExample8: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250,
      xorder: 'desc'
    }
  };

  pieExample9: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Pie Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250,
      continue: true
    }
  };



  barExample: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 110, count_4xx: 160, count_5xx: 80 }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: values('2xx'), y: field('count_2xx') }, name: 'Nombre d\'appels' },
        { data: { x: values('4xx'), y: field('count_4xx') }, name: 'Nombre d\'appels' },
        { data: { x: values('5xx'), y: field('count_5xx') }, name: 'Nombre d\'appels' }
      ],
      height: 250
    }
  };

  barExample2: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count: 110, field: '2xx' },
      { count: 160, field: '4xx' },
      { count: 80, field: '5xx' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: 'Nombre d\'appels' }
      ],
      height: 250
    }
  };

  barExample3: { data: any[], config: ChartProvider<string, number> } = {
    data: [],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: values('2xx'), y: values(110) } },
        { data: { x: values('4xx'), y: values(160) } },
        { data: { x: values('5xx'), y: values(80) } }
      ],
      height: 250
    }
  };

  barExample4: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: joinFields('_', 'field', 'subField'), y: field('count') } }
      ],
      height: 250
    }
  };

  barExample5: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: field('subField') }
      ],
      height: 250
    }
  };

  barExample6: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250
    }
  };

  barExample7: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250,
      xorder: 'asc'
    }
  };

  barExample8: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250,
      xorder: 'desc'
    }
  };

  barExample9: { data: any[], config: ChartProvider<string, number> } = {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' }
      ],
      height: 250,
      continue: true
    }
  };

  barExample10: { data: any[], config: ChartProvider<XaxisType, number> } = {
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
      { day: '3', status: 500, count: 12, group: '5xx' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('day'), y: field('count') }, name: (o, i) => `st-${o['status']}`, stack: field('group') }, 
      ],
      height: 250,
      stacked: true
    }
  };

  funnelExample: { data: any[], config: ChartProvider<XaxisType, number> } = {
    data: [
      { count: 30, field: 'v1' },
      { count: 90, field: 'v2' },
      { count: 60, field: 'v3' }
    ],
    config: {
      title: 'Exemple de Bar Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: 'test' }
      ],
      height: 250,
      options: {
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: true,
            distributed: true,
            barHeight: "80%",
            isFunnel: true
          }
        }
      }
    }
  }

  treemapExample: { data: any[], config: ChartProvider<XaxisType, YaxisType> } = {
    data: [
      { count: 10, field: 'ABC' },
      { count: 30, field: 'DEF' },
      { count: 20, field: 'XYZ' },
      { count: 60, field: 'ABCD' },
      { count: 10, field: 'DEFG' },
      { count: 31, field: 'WXYZ' },
      { count: 70, field: 'PQR' },
      { count: 30, field: 'MNO' },
      { count: 44, field: 'CDE' }
    ],
    config: {
      title: 'Exemple de TreeMap Chart',
      series: [
        { data: { x: field('field'), y: field('count') } }
      ],
      height: 250
    }
  }

  treemapExample2: { data: any[], config: ChartProvider<XaxisType, YaxisType> } = {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABCD', categ: 'Mobile' },
      { count: 10, field: 'DEFG', categ: 'Mobile' },
      { count: 31, field: 'WXYZ', categ: 'Mobile' },
      { count: 70, field: 'PQR', categ: 'Mobile' },
      { count: 30, field: 'MNO', categ: 'Mobile' },
      { count: 44, field: 'CDE', categ: 'Mobile' }
    ],
    config: {
      title: 'Exemple de TreeMap Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: field('categ') }
      ],
      height: 250
    }
  }

  treemapExample3: { data: any[], config: ChartProvider<XaxisType, YaxisType> } = {
    data: [
      { count: 10, field: 'ABC', categ: 'Desktops' },
      { count: 30, field: 'DEF', categ: 'Desktops' },
      { count: 20, field: 'XYZ', categ: 'Desktops' },
      { count: 60, field: 'ABC', categ: 'Mobile' },
      { count: 10, field: 'DEF', categ: 'Mobile' },
      { count: 31, field: 'XYZ', categ: 'Mobile' }
    ],
    config: {
      title: 'Exemple de HeatMap Chart',
      series: [
        { data: { x: field('field'), y: field('count') }, name: field('categ') }
      ],
      height: 250
    }
  }

  lineExample1: { data: any[], config: ChartProvider<XaxisType, YaxisType> } = {
    data: [
      { count: 10, field: '2020' },
      { count: 30, field: '2021' },
      { count: 20, field: '2022' },
      { count: 60, field: '2023' },
      { count: 10, field: '2024' }
    ],
    config: {
      title: 'Exemple de Line Chart Avec Une Serie',
      series: [
        { data: { x: field('field'), y: field('count') } }
      ],
      height: 250
    }
  };

  lineExample2: { data: any[], config: ChartProvider<XaxisType, YaxisType> } = {
    data: [
      { count1: 10, count2: 0, field: '2020' },
      { count1: 30, count2: 60, field: '2021' },
      { count1: 20, count2: 50, field: '2022' },
      { count1: 60, count2: 60, field: '2023' },
      { count1: 10, count2: 0, field: '2024' }
    ],
    config: {
      title: 'Exemple de Line Chart Avec Plusieurs Series',
      series: [
        { data: { x: field('field'), y: field('count1') }, name: 'Sub Field 1' },
        { data: { x: field('field'), y: field('count2') }, name: 'Sub Field 2' }
      ],
      height: 250
    }
  };

  areaExample1: { data: any[], config: ChartProvider<XaxisType, YaxisType> } = {
    data: [
      { count: 10, date: '2020' },
      { count: 30, date: '2021' },
      { count: 20, date: '2022' },
      { count: 60, date: '2023' },
      { count: 10, date: '2024' }
    ],
    config: {
      title: 'Exemple d\'Area Chart Avec Une Serie',
      series: [
        { data: { x: field('date'), y: field('count') } }
      ],
      height: 250
    }
  };

  ngOnInit() {

  }

  ngAfterViewInit() {
  }
}
