import {ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

export interface ChartData<X extends XaxisType, Y extends YaxisType> { data: any[]; config: ChartProvider<X, Y>; }

export type PieChartData = ChartData<string, number>;
export type BarChartData = ChartData<string | XaxisType, number>;
export type LineChartData = ChartData<string, number>;
export type SplineChartData = ChartData<string, number>;
export type TreemapChartData = ChartData<XaxisType, YaxisType>;
export type HeatmapChartData = ChartData<XaxisType, YaxisType>;
export type MapChartData = ChartData<string, number>;
export type RangeChartData = ChartData<XaxisType, number[]>;
export type FunnelChartData = ChartData<XaxisType, number>;
export type ComboChartData = ChartData<string, number>;
export type ScatterChartData = ChartData<number, number>;
export type BubbleChartData = ChartData<number, number>;
export type PolarChartData = ChartData<string, number>;
export type RadarChartData = ChartData<string, number>;
export type RadialBarChartData = ChartData<string, number>;
export type ChartDataCollection<T> = { [key: string]: T; };
