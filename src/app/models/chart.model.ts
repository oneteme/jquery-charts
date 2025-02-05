import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

export interface ChartData<X extends XaxisType, Y extends YaxisType> {
  data: any[];
  config: ChartProvider<X, Y>;
}