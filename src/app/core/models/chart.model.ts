import { ChartProvider, XaxisType, YaxisType, DataProvider, CoordinateProvider } from '@oneteme/jquery-core';

export interface SeriesConfig<X extends XaxisType, Y extends YaxisType> {
  data: {
    x: DataProvider<X>;
    y: DataProvider<Y>;
  };
  name?: string | ((o: any, i: number) => string);
  color?: string;
  type?: string;
  stack?: string | DataProvider<string>;
}

export interface CommonChartConfig<X extends XaxisType, Y extends YaxisType> {
  series: Array<SeriesConfig<X, Y>>;
  title?: string;
  subtitle?: string;
  xtitle?: string;
  ytitle?: string;
  width?: number;
  height?: number;
  showToolbar?: boolean;
  pivot?: boolean;
  continue?: boolean;
  stacked?: boolean;
  xorder?: 'asc' | 'desc';
  options?: {
    dataLabels?: {
      enabled?: boolean;
      enabledOnSeries?: number[];
    };
    plotOptions?: {
      pie?: {
        donut?: {
          size?: string;
        };
      };
      bar?: {
        horizontal?: boolean;
        borderRadius?: number;
        barHeight?: string;
        distributed?: boolean;
        isFunnel?: boolean;
      };
    };
    yaxis?: Array<{
      title?: {
        text?: string;
      };
      opposite?: boolean;
    }>;
  };
}

export interface ChartData<X extends XaxisType, Y extends YaxisType> {
  data: any[];
  config: CommonChartConfig<X, Y>;
}

// Types spécifiques
export type PieChartData = ChartData<string, number>;
export type BarChartData = ChartData<string | XaxisType, number>;
export type LineChartData = ChartData<string, number>;
export type TreemapChartData = ChartData<XaxisType, YaxisType>;
export type HeatmapChartData = ChartData<XaxisType, YaxisType>;
export type RangeChartData = ChartData<XaxisType, number[]>;
export type FunnelChartData = ChartData<XaxisType, number>;
export type ComboChartData = ChartData<string, number>;

export type ChartDataCollection<T> = {
  [key: string]: T;
};
