import { Component } from '@angular/core';
import { ChartConfig } from '@oneteme/jquery-core';
import { DataSet } from 'projects/oneteme/jquery-core/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  pieExample: { data: any[], config: ChartConfig } = {
    data: [
      { fieldOne: 30, fieldTwo: 70, fieldThree: 20 }
    ],
    config: {
      title: 'Exemple de Pie Chart n°1',
      mappers: [
        { field: 'fieldOne', label: 'Field 1', color: '#33cc33' },
        { field: 'fieldTwo', label: 'Field 2', color: '#ffa31a' },
        { field: 'fieldThree', label: 'Field 3', color: '#ff0000' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  pieExample2: { data: any[], config: ChartConfig } = {
    data: [
      { number: 40, field: 'Field 1' },
      { number: 20, field: 'Field 2' },
      { number: 50, field: 'Field 3' },
      { number: 80, field: 'Field 4' }
    ],
    config: {
      title: 'Exemple de Pie Chart n°2',
      category: {
        type: 'string',
        mapper: 'field'
      },
      mappers: [
        { field: 'number', label: 'Total' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  pieExample3: { data: any[], config: ChartConfig } = {
    data: [
      { number: 40, field: 'Field 1', field2: 'Field 1' },
      { number: 20, field: 'Field 2', field2: 'Field 1' },
      { number: 50, field: 'Field 3', field2: 'Field 1' },
      { number: 80, field: 'Field 4', field2: 'Field 1' }
    ],
    config: {
      title: 'Exemple de Pie Chart n°3',
      category: {
        type: 'string',
        mapper: ['field', 'field2']
      },
      mappers: [
        { field: 'number', label: 'Total' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  donutExample1: { data: any[], config: ChartConfig } = {
    data: [
      { fieldOne: 30, fieldTwo: 70, fieldThree: 20 }
    ],
    config: {
      title: 'Exemple de Donut Chart n°1',
      mappers: [
        { field: 'fieldOne', label: 'Field 1', color: '#33cc33' },
        { field: 'fieldTwo', label: 'Field 2', color: '#ffa31a' },
        { field: 'fieldThree', label: 'Field 3', color: '#ff0000' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  donutExample2: { data: any[], config: ChartConfig } = {
    data: [
      { number: 40, field: 'Field 1' },
      { number: 20, field: 'Field 2' },
      { number: 50, field: 'Field 3' },
      { number: 80, field: 'Field 4' }
    ],
    config: {
      title: 'Exemple de Donut Chart n°2',
      category: {
        type: 'string',
        mapper: 'field'
      },
      mappers: [
        { field: 'number', label: 'Total' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  donutExample3: { data: any[], config: ChartConfig } = {
    data: [
      { number: 40, field: 'Field 1', field2: 'Field 1' },
      { number: 20, field: 'Field 2', field2: 'Field 1' },
      { number: 50, field: 'Field 3', field2: 'Field 1' },
      { number: 80, field: 'Field 4', field2: 'Field 1' }
    ],
    config: {
      title: 'Exemple de Donut Chart n°3',
      category: {
        type: 'string',
        mapper: ['field', 'field2']
      },
      mappers: [
        { field: 'number', label: 'Total' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  polarAreaExample1: { data: any[], config: ChartConfig } = {
    data: [
      { fieldOne: 30, fieldTwo: 70, fieldThree: 20 }
    ],
    config: {
      title: 'Exemple de PolarArea Chart n°1',
      mappers: [
        { field: 'fieldOne', label: 'Field 1', color: '#33cc33' },
        { field: 'fieldTwo', label: 'Field 2', color: '#ffa31a' },
        { field: 'fieldThree', label: 'Field 3', color: '#ff0000' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  polarAreaExample2: { data: any[], config: ChartConfig } = {
    data: [
      { number: 40, field: 'Field 1' },
      { number: 20, field: 'Field 2' },
      { number: 50, field: 'Field 3' },
      { number: 80, field: 'Field 4' }
    ],
    config: {
      title: 'Exemple de PolarArea Chart n°2',
      category: {
        type: 'string',
        mapper: 'field'
      },
      mappers: [
        { field: 'number', label: 'Total' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  polarAreaExample3: { data: any[], config: ChartConfig } = {
    data: [
      { number: 40, field: 'Field 1', field2: 'Field 1' },
      { number: 20, field: 'Field 2', field2: 'Field 1' },
      { number: 50, field: 'Field 3', field2: 'Field 1' },
      { number: 80, field: 'Field 4', field2: 'Field 1' }
    ],
    config: {
      title: 'Exemple de PolarArea Chart n°3',
      category: {
        type: 'string',
        mapper: ['field', 'field2']
      },
      mappers: [
        { field: 'number', label: 'Total' }
      ],
      options: {
        chart: { height: 250 }
      }
    }
  };

  lineExample1: { data: any[], config: ChartConfig } = {
    data: [
      { count: 10, date: '2020' },
      { count: 30, date: '2021' },
      { count: 20, date: '2022' },
      { count: 60, date: '2023' },
      { count: 10, date: '2024' }
    ],
    config: {
      title: 'Exemple de Line Chart n°1',
      category: {
        type: 'string',
        mapper: 'date'
      },
      mappers: [
        { field: 'count', label: 'Count' }
      ],
      options: {
        chart: {
          height: 250,
          toolbar: {
            show: false
          }
        }
      }
    }
  };

  areaExample1: { data: any[], config: ChartConfig } = {
    data: [
      { count: 10, date: '2020' },
      { count: 30, date: '2021' },
      { count: 20, date: '2022' },
      { count: 60, date: '2023' },
      { count: 10, date: '2024' }
    ],
    config: {
      title: 'Exemple d\'Area Chart n°1',
      category: {
        type: 'string',
        mapper: 'date'
      },
      mappers: [
        { field: 'count', label: 'Count' }
      ],
      options: {
        chart: {
          height: 250,
          toolbar: {
            show: false
          }
        }
      }
    }
  };

  barExample1: { data: any[], config: ChartConfig } = {
    data: [
      { count1: 20, count2: 10, count3: 40, field: 'Field 1' },
      { count1: 60, count2: 20, count3: 10, field: 'Field 2' },
      { count1: 10, count2: 50, count3: 20, field: 'Field 3' },
      { count1: 20, count2: 10, count3: 40, field: 'Field 4' },
    ],
    config: {
      title: 'Exemple de Bar Chart n°1',
      category: {
        type: 'string',
        mapper: 'field'
      },
      mappers: [
        { field: 'count1', label: 'Count 1' },
        { field: 'count2', label: 'Count 2' },
        { field: 'count3', label: 'Count 3' }
      ],
      options: {
        chart: {
          height: 250,
          toolbar: {
            show: false
          }
        }
      }
    }
  };

  barExample2: { data: any[], config: ChartConfig } = {
    data: [
      { count1: 20, field: 'Field 1', subField: 'Sub Field 1', group: 'Group 1' },
      { count1: 60, field: 'Field 1', subField: 'Sub Field 2', group: 'Group 1' },
      { count1: 20, field: 'Field 1', subField: 'Sub Field 3', group: 'Group 2' },
      { count1: 60, field: 'Field 1', subField: 'Sub Field 4', group: 'Group 2' },
      { count1: 30, field: 'Field 2', subField: 'Sub Field 1', group: 'Group 1' },
      { count1: 100, field: 'Field 2', subField: 'Sub Field 2', group: 'Group 1' },
      { count1: 30, field: 'Field 2', subField: 'Sub Field 3', group: 'Group 2' },
      { count1: 100, field: 'Field 2', subField: 'Sub Field 4', group: 'Group 2' },
      { count1: 50, field: 'Field 3', subField: 'Sub Field 1', group: 'Group 1' },
      { count1: 30, field: 'Field 3', subField: 'Sub Field 2', group: 'Group 1' },
      { count1: 50, field: 'Field 3', subField: 'Sub Field 3', group: 'Group 2' },
      { count1: 30, field: 'Field 3', subField: 'Sub Field 4', group: 'Group 2' },
      { count1: 80, field: 'Field 4', subField: 'Sub Field 1', group: 'Group 1' },
      { count1: 40, field: 'Field 4', subField: 'Sub Field 2', group: 'Group 1' },
      { count1: 80, field: 'Field 4', subField: 'Sub Field 3', group: 'Group 2' },
      { count1: 40, field: 'Field 4', subField: 'Sub Field 4', group: 'Group 2' },
    ],
    config: {
      title: 'Exemple de Bar Chart n°2',
      category: {
        type: 'string',
        mapper: 'field'
      },
      mappers: [
        { field: 'count1', stack: 'subField', group: 'group' },
      ],
      options: {
        chart: {
          height: 250,
          stacked: true,
          toolbar: {
            show: false
          }
        }
      }
    }
  };


  ngOnInit() {
    let dataSet = new DataSet(this.barExample2.data, this.barExample2.config.category?.mapper);
    console.log("dataset debug", dataSet.data(this.barExample2.config.mappers, 0).map(d => {
      return { name: d.name, group: d.group, color: d.mapper.color, data: d.data };
    }));
  }
}
