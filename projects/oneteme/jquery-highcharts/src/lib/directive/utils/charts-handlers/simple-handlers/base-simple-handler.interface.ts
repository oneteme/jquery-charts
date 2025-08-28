import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

export interface SimpleChartHandler<X extends XaxisType = XaxisType> {
  handle(
    commonChart: any,
    chartConfig: ChartProvider<X, YaxisType>,
    chartType: string,
    debug?: boolean
  ): {
    series: any[];
    xAxis?: any;
    [key: string]: any;
  };
}
