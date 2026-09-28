import { Highcharts } from '../utils/highcharts-modules';

export class HighchartsInstanceController {
  private instance: Highcharts.Chart | null = null;

  get chart(): Highcharts.Chart | null {
    return this.instance;
  }

  create(
    element: HTMLElement,
    options: Highcharts.Options,
    isMap: boolean,
  ): Highcharts.Chart {
    if (isMap) {
      const mapChart = (Highcharts as any).mapChart;
      if (typeof mapChart !== 'function') {
        throw new TypeError('Le module Highcharts Maps n\'est pas disponible.');
      }
      this.instance = mapChart(element, options);
    } else {
      this.instance = Highcharts.chart(element, options);
    }
    return this.instance;
  }

  resize(width: number, height: number): void {
    if (this.instance && width > 0 && height > 0) {
      this.instance.setSize(width, height, false);
    }
  }

  destroy(): void {
    if (!this.instance) return;
    try {
      this.instance.destroy();
    } finally {
      this.instance = null;
    }
  }
}
