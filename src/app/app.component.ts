import { Component } from '@angular/core';
import { ChartConfig, XaxisType, YaxisType, field, joinFields, values } from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // pieExample: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // pieExample2: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // pieExample3: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // donutExample1: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // donutExample2: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // donutExample3: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // polarAreaExample1: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // polarAreaExample2: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // polarAreaExample3: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // lineExample1: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // lineExample2: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // lineExample3: { data: any[], config: ChartConfig<MultiLineChartMapper> } = {
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

  // areaExample1: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // barExample1: { data: any[], config: ChartConfig<DataMapper> } = {
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

  // barExample2: { data: any[], config: ChartConfig<StackedBarChartMapper> } = {
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

  // barExample3: { data: any[], config: ChartConfig<BarChartMapper> } = {
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

  // funnelExample: { data?: any[], config: ChartConfig<DataMapper> } = {
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

  pieExample: { data: any[], config: ChartConfig<string, number> } = {
    data: [
      { count1: 30, count2: 70, count3: 20 }
    ],
    config: {
      title: 'Exemple de Pie Chart n°1',
      mappers: [
        { data: {x: values('Field 1'), y: field('count1')} },
        { data: {x: values('Field 2'), y: field('count2')} },
        { data: {x: values('Field 3'), y: field('count3')} }
      ],
      height: 250
    }
  };

  pieExample2: { data: any[], config: ChartConfig<string, number> } = {
    data: [
      { count: 40, field: 'Field 1' },
      { count: 20, field: 'Field 2' },
      { count: 50, field: 'Field 3' },
      { count: 80, field: 'Field 4' }
    ],
    config: {
      title: 'Exemple de Pie Chart n°2',
      mappers: [
        { data: {x: field('field'), y: field('count')} },
      ],
      height: 250,
    }
  };

  pieExample3: { data: any[], config: ChartConfig<string, number> } = {
    data: [
      { count: 40, field: 'Field 1', subField: 'Sub Field 1' },
      { count: 20, field: 'Field 2', subField: 'Sub Field 1' },
      { count: 50, field: 'Field 3', subField: 'Sub Field 1' },
      { count: 80, field: 'Field 4', subField: 'Sub Field 1' }
    ],
    config: {
      title: 'Exemple de Pie Chart n°3',
      mappers: [
        { data: {x: joinFields('_', 'field', 'subField'), y: field('count')} }
      ],
      height: 250
    }
  };

  barExample1: { data: any[], config: ChartConfig<XaxisType, number> } = {
    data: [
      { count1: 20, count2: 10, count3: 40, field: 'Field 1' },
      { count1: 60, count2: 20, count3: 10, field: 'Field 2' },
      { count1: 10, count2: 50, count3: 20, field: 'Field 3' },
      { count1: 20, count2: 10, count3: 40, field: 'Field 4' }
    ],
    config: {
      title: 'Exemple de Bar Chart Classique',
      mappers: [
        { data: {x: field('field'), y: field('count1')}, name: 'Sub Field 1' },
        { data: {x: field('field'), y: field('count2')}, name: 'Sub Field 2' },
        { data: {x: field('field'), y: field('count3')}, name: 'Sub Field 3' }
      ],
      height: 250,
      options: {
        chart: {
          toolbar: {
            show: false
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        }
      }
    }
  };

  barExample2: { data: any[], config: ChartConfig<XaxisType, number> } = {
    data: [
      { count1: 20, count2: 60, count3: 20, count4: 60, field: 'Field 1' },
      { count1: 30, count2: 100, count3: 30, count4: 100, field: 'Field 2' },
      { count1: 50, count2: 30, count3: 50, count4: 30, field: 'Field 3' },
      { count1: 80, count2: 40, count3: 80, count4: 40, field: 'Field 4' },
    ],
    config: {
      title: 'Exemple de Bar Chart Stacked Sans Pivot',
      mappers: [
        { data: {x: field('field'), y: field('count1')}, name: 'Sub Field 1' },
        { data: {x: field('field'), y: field('count2')}, name: 'Sub Field 2' },
        { data: {x: field('field'), y: field('count3')}, name: 'Sub Field 3' },
        { data: {x: field('field'), y: field('count4')}, name: 'Sub Field 4' }
      ],
      height: 250,
      options: {
        chart: {
          stacked: true,
          toolbar: {
            show: false
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        }
      }
    }
  };

  barExample3: { data: any[], config: ChartConfig<XaxisType, YaxisType> } = {
    data: [
      { count1: 20, count2: 60, count3: 20, count4: 60, field: 'Field 1' },
      { count1: 30, count2: 100, count3: 30, count4: 100, field: 'Field 2' },
      { count1: 50, count2: 30, count3: 50, count4: 30, field: 'Field 3' },
      { count1: 80, count2: 40, count3: 80, count4: 40, field: 'Field 4' }
    ],
    config: {
      title: 'Exemple de Bar Chart Stacked Avec Pivot',
      mappers: [
        { data: {x: field('field'), y: field('count1')} },
        { data: {x: field('field'), y: field('count2')} },
        { data: {x: field('field'), y: field('count3')} },
        { data: {x: field('field'), y: field('count4')} }
      ],
      pivot: true,
      height: 250,
      options: {
        chart: {
          stacked: true,
          toolbar: {
            show: false
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        }
      }
    }
  };

  // barExample3: { data: any[], config: ChartConfig<XaxisType, YaxisType> } = {
  //   data: [
  //     { count1: 20, field: 'Field 1', subField: 'Sub Field 1' },
  //     { count1: 60, field: 'Field 1', subField: 'Sub Field 2' },
  //     { count1: 20, field: 'Field 1', subField: 'Sub Field 3' },
  //     { count1: 60, field: 'Field 1', subField: 'Sub Field 4' },
  //     { count1: 30, field: 'Field 2', subField: 'Sub Field 1' },
  //     { count1: 50, field: 'Field 3', subField: 'Sub Field 1' },
  //     { count1: 80, field: 'Field 4', subField: 'Sub Field 1' }
  //   ],
  //   config: {
  //     title: 'Exemple de Bar Chart n°2',
  //     mappers: [
  //       { data: {x: field('field'), y: field('count1')} }
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

  funnelExample: { data: any[], config: ChartConfig<XaxisType, number> } = {
    data: [
      { count: 20, field: 'Field 1' },
      { count: 60, field: 'Field 2' },
      { count: 100, field: 'Field 3' },
      { count: 200, field: 'Field 4' },
      { count: 240, field: 'Field 5' }
    ],
    config: {
      title: 'Exemple de Funnel Chart n°1',
      mappers: [
        { data: {x: field('field'), y: field('count')} }
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

  lineExample1: { data: any[], config: ChartConfig<XaxisType, YaxisType> } = {
    data: [
      { count: 10, field: '2020' },
      { count: 30, field: '2021' },
      { count: 20, field: '2022' },
      { count: 60, field: '2023' },
      { count: 10, field: '2024' }
    ],
    config: {
      title: 'Exemple de Line Chart Avec Une Serie',
      mappers: [
        { data: {x: field('field'), y: field('count')} }
      ],
      height: 250,
      options: {
        chart: {
          toolbar: {
            show: false
          }
        }
      }
    }
  };

  lineExample2: { data: any[], config: ChartConfig<XaxisType, YaxisType> } = {
    data: [
      { count1: 10, count2: 0, field: '2020' },
      { count1: 30, count2: 60, field: '2021' },
      { count1: 20, count2: 50, field: '2022' },
      { count1: 60, count2: 60, field: '2023' },
      { count1: 10, count2: 0, field: '2024' }
    ],
    config: {
      title: 'Exemple de Line Chart Avec Plusieurs Series',
      mappers: [
        { data: {x: field('field'), y: field('count1')}, name: 'Sub Field 1' },
        { data: {x: field('field'), y: field('count2')}, name: 'Sub Field 2' }
      ],
      height: 250,
      options: {
        chart: {
          toolbar: {
            show: false
          }
        },
        stroke: {
          width: 5,
          curve: "straight",
          dashArray: [0, 8, 5]
        }
      }
    }
  };

  areaExample1: { data: any[], config: ChartConfig<XaxisType, YaxisType> } = {
    data: [
      { count: 10, date: '2020' },
      { count: 30, date: '2021' },
      { count: 20, date: '2022' },
      { count: 60, date: '2023' },
      { count: 10, date: '2024' }
    ],
    config: {
      title: 'Exemple d\'Area Chart Avec Une Serie',
      mappers: [
        { data: {x: field('date'), y: field('count')} }
      ],
      height: 250,
      options: {
        chart: {
          toolbar: {
            show: false
          }
        }
      }
    }
  };

  ngOnInit() {

  }
}
