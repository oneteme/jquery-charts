import { XaxisType } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';
import { StandardHandler } from './standard.handler';
import { BoxplotHandler } from './boxplot.handler';
import { BubbleHandler } from './bubble.handler';
import { ScatterHandler } from './scatter.handler';
import { HeatmapHandler } from './heatmap.handler';
import { TreemapHandler } from './treemap.handler';

export type SpecialChartType =
  | 'boxplot'
  | 'bubble'
  | 'scatter'
  | 'heatmap'
  | 'treemap';

export class ChartHandlerFactory {
  private static readonly handlers = new Map<string, any>([
    ['standard', StandardHandler],
    ['boxplot', BoxplotHandler],
    ['bubble', BubbleHandler],
    ['scatter', ScatterHandler],
    ['heatmap', HeatmapHandler],
    ['treemap', TreemapHandler],
  ]);

  static createHandler<X extends XaxisType = XaxisType>(
    type: string
  ): ChartHandler<X> {
    const HandlerClass =
      this.handlers.get(type) || this.handlers.get('standard');
    return new HandlerClass();
  }

  static isSpecialChartType(type: string): boolean {
    return this.handlers.has(type) && type !== 'standard';
  }

  static registerHandler(type: string, handlerClass: any): void {
    this.handlers.set(type, handlerClass);
  }
}
