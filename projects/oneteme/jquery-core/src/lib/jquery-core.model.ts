export declare type ChartType = 'line' | 'area' | 'pie' | "donut" | "radialBar" | "polarArea" | 'bar' | 'treemap' | 'funnel' | 'pyramid';

export function values<T>(...values: T[]): DataProvider<T> {
    return (o, idx)=>{ //this[single]=true
        if(idx < values.length){
            return values[idx];
        }
        throw `idx=${idx} out of values=${values}`;
    }; 
}

export function field<T>(name: string): DataProvider<T> {
    return o=> o[name];
}

export function mapField<T>(name: string, map: Map<any, T>): DataProvider<T> {
    return o=> map.get(o[name]);
}

export function joinFields(separator: string = '_', ...names: string[]): DataProvider<string> {
    return combineFields(names, args=> args.join(separator));
}

export function combineFields<T>(names: string[], fn: (args: any[])=> T): DataProvider<T> {
    return o=> fn(names.map(f=> o[f]).filter(nonUndefined));
}

export function rangeFields<T>(minName: string, maxName: string): DataProvider<T[]> {
    return (o, i)=> {
        var minFn: DataProvider<T> = field(minName);
        var maxFn: DataProvider<T> = field(maxName);
        var min = minFn(o,i);
        var max = maxFn(o,i);
        return nonUndefined(min) && nonUndefined(max) ? [min, max] : undefined;
    };
}

export function series<X extends XaxisType, Y extends YaxisType>(objects: any[], mappers: DataMapper<X,Y>[], continues: boolean, defaultValue?: Y) : CommonSerie<Y|Coordinate2D>[] {
    if(continues){
        return mappers.map(m=> continueSerie(objects, m, defaultValue));
    }
    var categs = distinct(objects, mappers.map(m=> m.data.x));
    return mappers.map(m=> discontinueSerie(objects, categs, m, defaultValue));
}

export function continueSerie<X extends XaxisType, Y extends YaxisType>(objects: any[], mapper: DataMapper<X,Y>, defaultValue?: Y) : CommonSerie<Coordinate2D> {
    var arr = objects.map((o,i)=>({x: mapper.data.x(o,i), y: requireNonUndefined(mapper.data.y(o,i), defaultValue)}));
    return {name: mapper.name, group: mapper.group, data: arr};
}

export function discontinueSerie<X extends XaxisType, Y extends YaxisType>(objects: any[], categories: X[], mapper: DataMapper<X,Y>, defaultValue?: Y) : CommonSerie<Y> {
    var arr = []
    objects.map((o,i)=>{
        var key = mapper.data.x(o,i);
        var idx = categories.indexOf(key);
        if(idx > -1){
            arr[idx] = requireNonUndefined(mapper.data.y(o,i), defaultValue);
        }
        else{
            throw `${key} not part of categories : ${categories}`;
        }
    });
    if(nonUndefined(defaultValue)){
        for(var i=0; i<arr.length; i++){
            if(isUndefined(arr[i])){
                arr[i] = defaultValue;
            }
        }
    }
    return {name: mapper.name, group: mapper.group, data: arr};
}

export function pivotSeries<X extends XaxisType, Y extends YaxisType>(objects: any[], mappers: DataMapper<X,Y>[], continues: boolean, defaultValue?: Y) : CommonSerie<Y|Coordinate2D>[] {
    return continues 
        ? objects.map((o,idx)=> pivotContinueSerie(o, idx, mappers, defaultValue))
        : objects.map((o,idx)=> pivotDiscontinueSerie(o, idx, mappers, defaultValue));
}

export function pivotContinueSerie<X extends XaxisType, Y extends YaxisType>(o: any, idx: number, mapper: DataMapper<X,Y>[], defaultValue?: Y) : CommonSerie<Coordinate2D> {
    return {name: 'pivot', data: mapper.map(m=> ({x: m.name, y: requireNonUndefined(m.data.y(o,idx), defaultValue)}))};
}

export function pivotDiscontinueSerie<X extends XaxisType, Y extends YaxisType>(o: any, idx: number, mapper: DataMapper<X,Y>[], defaultValue?: Y) : CommonSerie<Y> {
    return {name: 'pivot', data: mapper.map(m=> requireNonUndefined(m.data.y(o,idx), defaultValue))};
}



export function distinct<T>(objects: any[], providers : DataProvider<T>[]) : T[] { // T == XaxisType
    var categs = new Set<T>();
    providers.forEach(p=> objects.forEach((o,i)=> categs.add(p(o,i))));
    return [...categs];
}

function nonUndefined(o: any): boolean {
    return !isUndefined(o);
}

function requireNonUndefined<T>(o: T, elseValue: T) : T{
    return isUndefined(o) ? elseValue : o;
}

function isUndefined(o: any): boolean {
    return o == null || o == undefined;
}

export interface ChartConfig<X extends XaxisType, Y extends YaxisType> { 
    title?: string;
    subtitle?: string;
    xtitle?: string;
    ytitle?: string | { [key: string]: string }; // multiple  {key: val}
    width?: number;
    height?: number;
    pivot?: boolean; //transpose  
    continue?: boolean;
    mappers?: DataMapper<X,Y>[];
    options?: any;
}

export interface DataMapper<X extends XaxisType, Y extends YaxisType> { //SerieBuider
    data: CoordinateProvider<X,Y>
    name?: string;
    group?: string;
    color?: string;
    unit?: string;
}

export interface CommonSerie<T> {
    data: T[];
    name?: string;
    group?: string
    color?: string
}

export declare type Coordinate2D = {x: XaxisType, y: YaxisType};

export declare type XaxisType = number | string | Date;

export declare type YaxisType = number | number[];//2D

export declare type CoordinateProvider<X,Y> = {x: DataProvider<X>, y: DataProvider<Y>};

export declare type DataProvider<T> = (o: any, idx: number) => T;





/*  OLD */


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