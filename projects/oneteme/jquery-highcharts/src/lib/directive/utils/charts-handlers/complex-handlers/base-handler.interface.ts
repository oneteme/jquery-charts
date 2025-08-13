import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

export interface ChartHandler<X extends XaxisType = XaxisType> {
  handle(
    data: any[], 
    chartConfig: ChartProvider<X, YaxisType>, 
    debug?: boolean
  ): any;
}

export interface HandlerResult {
  options: any;
  shouldRedraw?: boolean;
}
