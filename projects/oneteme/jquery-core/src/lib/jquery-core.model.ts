export interface ChartConfig {
    title?: string;
    subtitle?: string;
    category?: Category; // fn: o=> o.status + '_' + o.host
    xtitle?: string;
    ytitle?: string | { [key: string]: string }; // multiple  {key: val}
    mappers?: DataMapper[];
    options?: any;
}

export interface DataMapper {
    field: string; //  o=> {'value' : o.coun200, 'key': 'nb 200' }
    label?: string;
    unit?: string;
    color?: string;
    stack?: string;
    group?: string;
}

export interface Category {
    type: 'string' | 'number' | 'date';
    mapper: string | string[] | ((o: any) => any);
}

export interface ChartView {
    config: ChartConfig;
    data: any[];
    isLoading: boolean;
}

export interface RowSet {
    name?: string;
    group?: string;
    data: any[];
    mapper: DataMapper;
}

export declare type ChartType = 'line' | 'area' | 'pie' | "donut" | "radialBar" | "polarArea" | 'bar' | 'treemap';

export function toCategoriesFn(categories?: string | string[] | ((o: any) => any)): (o: any) => any {
    if (!categories) {
        return o => undefined;
    } // o=> undefined;

    if (typeof categories === 'string') {
        return o => o[categories];
    } else if (Array.isArray(categories)) {
        return o => categories.map(c => o[c]).join('_');
    } else if (typeof categories === 'function') {
        return categories
    }
    //warn
    return o => categories;
}

// Gestion des exceptions ? if field does not exist
export class DataSet {
    objects: any[];
    labels: string[];
    colFn: (o: any) => any;

    constructor(objects: any[], col: string | string[] | ((o: any) => any), dataMappers?: DataMapper[]) {
        this.objects = objects;
        this.colFn = toCategoriesFn(col);

        let cols: Set<any> = new Set();
        (dataMappers || objects).forEach(o => cols.add(this.colFn(o)));
        this.labels = [...cols];
    }

    order(compareFn?: (a: string, b: string) => number): DataSet {
        this.labels.sort(compareFn);
        return this;
    }

    data(mappers: DataMapper[], defaultValue: any = null): RowSet[] {
        return mappers.flatMap(m => {
            if (m.stack) {
                return this.stackedData(m, defaultValue);
            } else {
                return this.simpleData(m, defaultValue);
            }
        });
    }

    simpleData(mapper: DataMapper, defaultValue: any = null): RowSet {
        // Fonctionne pas avec l'order
        return { name: mapper.label, data: this.objects.map(o => isNaN(o[mapper.field]) ? defaultValue : o[mapper.field]), mapper: mapper };
    }

    stackedData(mapper: DataMapper, defaultValue: any = null): RowSet[] {
        let rowFn = toCategoriesFn(mapper.stack);
        let map = this.objects.reduce((acc, o) => {
            if (!acc[rowFn(o)]) {
                acc[rowFn(o)] = {};
            }
            acc[rowFn(o)][this.colFn(o)] = o[mapper.field];
            acc[rowFn(o)]['group'] = o[mapper.group];
            return acc;
        }, {});
        console.log("stackedData", map, this.objects);
        return Object.entries(map)
            .map((arr: [string, any]) => {
                return { name: arr[0], group: arr[1]['group'],  data: this.labels.map(l => isNaN(arr[1][l]) ? defaultValue : arr[1][l]), mapper: mapper }
            });
    }
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  /**
  * Deep merge two objects.
  * @param target
  * @param ...sources
  */
  export function mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return mergeDeep(target, ...sources);
  }