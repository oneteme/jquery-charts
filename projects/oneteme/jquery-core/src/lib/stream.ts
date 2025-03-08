

export function sumByKey<T>(arr: T[], keyFn: Function<T,string|number>, valFun: Function<T,number>): {[key:string]:number} {
  return groupBy(arr, keyFn, ()=>0, (acc, o)=> acc+valFun(o));
}

export function groupByField<T>(arr:T[], field:string) : {[key:string]:T[]} {
  return groupByKey(arr, getField(field));
}

export function groupByKey<T>(arr:T[], keyFn: Function<T,string|number>) : {[key:string]:T[]} {
  return groupBy(arr, keyFn, ()=> [], (acc, o)=> {acc.push(o); return acc;});
}

export function groupBy<T, V>(arr: T[], keyFn: Function<T,string|number>, initial: ()=> V, combiner: BiFunction<V,T,V>): {[key:string]:V} {
  return arr.reduce((acc, o) => {
    let key = keyFn(o);
    acc[key] = combiner(acc[key] == undefined ? acc[key] : initial(), o);
    return acc;
  }, {});
}

export function flattenEntriesByField<T>(map: {[key:string]:T}, keyField:string, valField:string): any[] {
  return flattenEntriesByFn(map, (k,v)=> keyField, (k,v)=> valField);
}

export function flattenEntriesByFn<T>(map: {[key:string]:T}, keyMapper: BiFunction<string,T,string>, valMapper: BiFunction<string,T,string>): any[]  {
  return flattenEntries(map, (k,v)=>{
    let o = {};
    o[keyMapper(k,v)] = k;
    o[valMapper(k,v)] = v;
    return o;
  });
}

export function flattenEntries<T,V>(map: {[key:string]:T}, mapper: BiFunction<string,T,V>): V[] {
  return Object.entries(map).map(arr=> mapper(arr[0], arr[1]));
}

export function getField<T,R>(name: string): Function<T,R> {
  return o=> o[name];
}

export declare type Function<T,R> = (o:T)=> R;

export declare type BiFunction<T,U,R> = (a:T,b:U)=> R;