import { SimpleChartHandler } from './base-simple-handler.interface';
import { PieHandler } from './pie.handler';
import { PolarHandler } from './polar.handler';
import { RadarHandler } from './radar.handler';

export class SimpleChartHandlerFactory {
  private static readonly handlers = new Map<string, SimpleChartHandler>();

  static {
    this.handlers.set('pie', new PieHandler());
    this.handlers.set('donut', new PieHandler());
    this.handlers.set('funnel', new PieHandler());
    this.handlers.set('pyramid', new PieHandler());
    this.handlers.set('radialBar', new PieHandler());
    this.handlers.set('polar', new PolarHandler());
    this.handlers.set('radar', new RadarHandler());
    this.handlers.set('radarArea', new RadarHandler());
  }

  static getHandler(chartType: string): SimpleChartHandler | null {
    return this.handlers.get(chartType) || null;
  }

  static getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
