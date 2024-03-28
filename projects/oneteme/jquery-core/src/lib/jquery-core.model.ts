export declare type ChartType = 'line' | 'area' | 'pie' | "donut" | "radialBar" | "polarArea" | 'bar' | 'treemap' | 'funnel' | 'pyramid';

export function constant<T>(value: T): DataProvider<T> {
    return (o: any, defaultValue: T) => value;
}

export function joinConstants(values: string[], separator: string = '_'): DataProvider<string> {
    return (o: any, defaultValue: string) => values.filter(v => !isUndefined(v)).join(separator) || defaultValue;
}

export function field<T>(field: string): DataProvider<T> {
    return (o: any, defaultValue: T) => isUndefined(o[field]) ? defaultValue : o[field];
}

//TODO other types !?
export function joinFields(fields: string[], separator: string = '_'): DataProvider<string> {
    return (o: any, defaultValue: string) => {
        var s = fields.map(f => o[f]).filter(v => v != null && v != undefined).join(separator);
        return isUndefined(s) ? defaultValue : s; //TODO check that 
    }
}

export function rangeFields<T>(minField: string, maxField: string): DataProvider<T[]> {
    return (o: any, defaultValue: T[]) => {
        var min: DataProvider<T> = field(minField);
        var max: DataProvider<T> = field(maxField);
        return [min(o, defaultValue[0]), max(o, defaultValue[1])]; //TODO change defaultValue 
    };
}

function isUndefined(o: any): boolean {
    return o == null || o == undefined;
}

export type DataProvider<T> = (o: any, defaultValue: T) => T;


export interface StackedBarChartMapper extends BarChartMapper {
    stackField: string;
}

export interface BarChartMapper extends DataMapper {
    group?: string;
}

export interface MultiLineChartMapper extends LineChartMapper {
    multiField: string;
}

export interface LineChartMapper extends DataMapper {

}

export interface PieChartMapper extends DataMapper {

}

export interface ChartConfig<T extends DataMapper> {
    title?: string;
    subtitle?: string;
    category?: DataProvider<any>; // fn: o=> o.status + '_' + o.host
    xtitle?: string;
    ytitle?: string | { [key: string]: string }; // multiple  {key: val}
    mappers?: T[];
    options?: any;
}

export interface DataMapper {
    x: DataProvider<number | string | Date>;
    y: DataProvider<number | number[]>; //  o=> {'value' : o.coun200, 'key': 'nb 200' }
    label: DataProvider<string>;
    unit?: string;
    color?: string;
}


export interface Category<T> {
    type: 'string' | 'number' | 'date';
    mapper: DataProvider<T>;
}

export interface ChartView<T extends DataMapper> {
    config: ChartConfig<T>;
    data: any[];
    isLoading: boolean;
}

export interface RowSet<T extends DataMapper> {
    name: string;
    data: any[];
    mapper: T;
    group?: string;
}


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


function serie<T>(objects: any[], provider : DataProvider<T>, defaultValue : T) : T[] {
    return objects.map(o=> provider(o, defaultValue));
}


function serie2<T>(objects: any[], categories: string[], dm : DataMapper, defaultValue : T) : T[] {;
    var arr = []
    objects.map(o=>{
        var key = dm.x(o, null); //TODO no default value
        var idx = categories.indexOf(key);
        if(idx > -1){
            arr[idx] = dm.y(o, defaultValue);
        }
    });
    return arr;
}


function categories(objects: any[], providers : DataProvider<string>[]){
    var categs = new Set<string>();
    providers.forEach(p=> objects.forEach(o=> categs.add(p(o, ""))));
    return [...categs];
}

// Gestion des exceptions ? if field does not exist
export class DataSet<T extends DataMapper> {
    objects: any[];
    labels: string[];
    colFn: (o: any) => any;

    constructor(objects: any[], continues: boolean, dataMappers?: T[]) {
        this.objects = objects;

        let cols: Set<any> = new Set();
        this.labels = [...cols];
    }

    order<T extends DataMapper>(compareFn?: (a: string, b: string) => number): DataSet<T> {
        this.labels.sort(compareFn);
        return this;
    }

    data<T extends DataMapper>(mappers: T[], defaultValue: any = null): RowSet<T>[] {
        return mappers.flatMap(m => {
            if (m['stackField'] || m['multiField']) {
                return this.stackedData(m, defaultValue);
            } else {
                return this.simpleData(m, defaultValue);
            }
        });
    }

    simpleData<T extends DataMapper>(mapper: T, defaultValue: any = null): RowSet<T> {
        // Fonctionne pas avec l'order
        // console.log("simpleData", { name: mapper.label, group: mapper.group, data: this.objects.map(o => isNaN(o[mapper.field]) ? defaultValue : o[mapper.field]), mapper: mapper })
        return { name: mapper.label, group: mapper['group'], data: mapper.field.build(this.objects, defaultValue), mapper: mapper };
    }

    stackedData<T extends DataMapper>(mapper: T, defaultValue: any = null): RowSet<T>[] {
        let rowFn = toCategoriesFn(mapper['stackField'] || mapper['multiField']);
        let map = this.objects.reduce((acc, o) => {
            if (!acc[rowFn(o)]) {
                acc[rowFn(o)] = {};
            }
            acc[rowFn(o)][this.colFn(o)] = o[mapper.field];
            acc[rowFn(o)]['group'] = o[mapper['group']];
            return acc;
        }, {});
        console.log("stackedData", map, this.objects);
        return Object.entries(map)
            .map((arr: [string, any]) => {
                return { name: arr[0], group: arr[1]['group'], data: this.labels.map(l => isNaN(arr[1][l]) ? defaultValue : arr[1][l]), mapper: mapper }
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