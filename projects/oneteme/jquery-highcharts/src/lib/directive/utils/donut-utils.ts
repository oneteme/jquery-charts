import { Highcharts } from './highcharts-modules';

export interface DonutCenterValueContext {
  chart: Highcharts.Chart;
  series: any;
  total: number;
  selectedPoint?: any;
  hoveredPoint?: any;
}

export interface DonutCenterOptions {
  enabled?: boolean;
  title?: string;
  value?: string | number | ((context: DonutCenterValueContext) => string | number | null | undefined);
  fixedContent?: boolean;
  fixedLabel?: boolean;
  fixedValue?: boolean;
  labelColor?: string;
  valueColor?: string;
  labelFontSize?: string;
  valueFontSize?: string;
  labelYOffset?: number;
  valueYOffset?: number;
  centerYOffset?: number;
}

export function applyDonutCenterLogic(options: Highcharts.Options, donutConfig?: DonutCenterOptions): void {
  if (donutConfig && donutConfig.enabled === false) return;

  // Default values
  const defaultTitle = donutConfig?.title || 'Total';
  const labelColor = donutConfig?.labelColor || '#666';
  const valueColor = donutConfig?.valueColor || '#333';
  const labelFontSize = donutConfig?.labelFontSize || '14px';
  const valueFontSize = donutConfig?.valueFontSize || '28px';
  const labelYOffset = donutConfig?.labelYOffset ?? -17;
  const valueYOffset = donutConfig?.valueYOffset ?? 13;
  const centerYOffset = donutConfig?.centerYOffset ?? 0;
  const fixedLabel = donutConfig?.fixedContent === true || donutConfig?.fixedLabel === true;
  const fixedValue =
    donutConfig?.fixedContent === true ||
    donutConfig?.fixedValue === true ||
    donutConfig?.value !== undefined;

  const formatValue = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return Highcharts.numberFormat(value, 0, ' ', ' ');
    return String(value);
  };

  const getTotal = (series: any): number =>
    (series?.points || [])
      .filter((p: any) => p.visible)
      .reduce((sum: number, point: any) => sum + point.y, 0);

  const getSelectedPoint = (series: any): any =>
    (series?.points || []).find((p: any) => p.sliced && p.visible);

  const getConfiguredValue = (
    chart: Highcharts.Chart,
    series: any,
    hoveredPoint?: any,
  ): string | number | null | undefined => {
    const configuredValue = donutConfig?.value;
    if (configuredValue === undefined) return undefined;

    if (typeof configuredValue === 'function') {
      return configuredValue({
        chart,
        series,
        total: getTotal(series),
        selectedPoint: getSelectedPoint(series),
        hoveredPoint,
      });
    }

    return configuredValue;
  };

  const getCenterTexts = (
    chart: Highcharts.Chart,
    series: any,
    hoveredPoint?: any,
  ): { labelText: string; valueText: string } => {
    const total = getTotal(series);
    const selectedPoint = getSelectedPoint(series);

    const dynamicLabel = hoveredPoint
      ? hoveredPoint.name
      : selectedPoint
      ? selectedPoint.name
      : defaultTitle;

    const dynamicValue = hoveredPoint
      ? hoveredPoint.y
      : selectedPoint
      ? selectedPoint.y
      : total;

    const configuredValue = getConfiguredValue(chart, series, hoveredPoint);

    const labelText = fixedLabel ? defaultTitle : dynamicLabel;
    const valueText =
      configuredValue !== undefined
        ? formatValue(configuredValue)
        : formatValue(fixedValue ? total : dynamicValue);

    return { labelText, valueText };
  };

  const anyOptions = options as any;
  anyOptions.chart = anyOptions.chart || {};
  anyOptions.chart.events = anyOptions.chart.events || {};
  anyOptions.plotOptions = anyOptions.plotOptions || {};
  anyOptions.plotOptions.pie = anyOptions.plotOptions.pie || {};
  anyOptions.plotOptions.series = anyOptions.plotOptions.series || {};
  anyOptions.plotOptions.series.point = anyOptions.plotOptions.series.point || {};
  anyOptions.plotOptions.series.point.events = anyOptions.plotOptions.series.point.events || {};

  const originalRender = anyOptions.chart.events.render;
  const originalClick = anyOptions.plotOptions.series.point.events.click;
  const originalMouseOver = anyOptions.plotOptions.series.point.events.mouseOver;
  const originalMouseOut = anyOptions.plotOptions.series.point.events.mouseOut;
  const originalChartClick = anyOptions.chart.events.click;

  anyOptions.chart.events.render = function (this: Highcharts.Chart) {
    if (originalRender) {
      originalRender.apply(this, arguments as any);
    }

    const series = this.series[0] as any;
    if (!series || !series.points || !series.center) return;

    const { labelText, valueText } = getCenterTexts(this, series);

    const centerX = series.center[0] + this.plotLeft;
    const centerY = series.center[1] + this.plotTop;

    const drawLabel = (
        key: string,
        text: string,
        yOffset: number,
        fontSize: string,
        fontWeight: string,
        color: string,
      ) => {
        const chart = this as any;
        if (chart[key]) {
          chart[key].attr({
            x: centerX,
            y: centerY + yOffset + centerYOffset,
            text: text,
          });
          chart[key].toFront();
        } else {
          chart[key] = this.renderer
            .text(text, centerX, centerY + yOffset + centerYOffset)
            .css({ color, fontSize, fontWeight, textAlign: 'center' })
            .attr({ align: 'center', zIndex: 10 })
            .add();
        }
      };

      drawLabel('customLabel', labelText, labelYOffset, labelFontSize, '400', labelColor);
      drawLabel('customTotalLabel', valueText, valueYOffset, valueFontSize, '700', valueColor);
  };

  anyOptions.chart.events.click = function(this: Highcharts.Chart, event: any) {
      if (originalChartClick) {
          originalChartClick.apply(this, arguments as any);
      }

      const chart = this as any;
      const series = chart.series[0];
      let hasChanges = false;
      if (series && series.points) {
        series.points.forEach((p: any) => {
          if (p.selected || p.sliced) {
            p.slice(false, false);
            p.select(false, false);
            hasChanges = true;
          }
        });
      }
      if (hasChanges) {
        chart.redraw();
      }
  }

  const pointClick = function (this: any) {
     const point = this as any;
     const series = point.series;

     if (anyOptions.plotOptions?.series?.allowPointSelect !== false &&
         anyOptions.plotOptions?.pie?.allowPointSelect !== false) {

         const willSlice = !point.sliced;

         series.points.forEach((p: any) => {
            if (p !== point) {
              p.slice(false, false);
              p.select(false, false);
            }
         });

         point.slice(willSlice, false);
         point.select(willSlice, false);
         series.chart.redraw();
     }

     if (originalClick) {
         return originalClick.apply(this, arguments as any);
     }
     return false;
  };

  anyOptions.plotOptions.series.point.events.click = pointClick;

  const pointMouseOver = function (this: any) {
    const point = this as any;
    const chart = point.series.chart as any;
    const { labelText, valueText } = getCenterTexts(chart, point.series, point);

    if (chart.customLabel) {
      chart.customLabel.attr({ text: labelText });
    }
    if (chart.customTotalLabel) {
      chart.customTotalLabel.attr({ text: valueText });
    }

    if (originalMouseOver) originalMouseOver.apply(this, arguments as any);
  };
  anyOptions.plotOptions.series.point.events.mouseOver = pointMouseOver;

  const pointMouseOut = function (this: any) {
    const point = this as any;
    const chart = point.series.chart as any;
    const series = point.series;
    const { labelText, valueText } = getCenterTexts(chart, series);

    if (chart.customLabel) {
        chart.customLabel.attr({ text: labelText });
    }
    if (chart.customTotalLabel) {
        chart.customTotalLabel.attr({ text: valueText });
    }

    if (originalMouseOut) originalMouseOut.apply(this, arguments as any);
  };
  anyOptions.plotOptions.series.point.events.mouseOut = pointMouseOut;
}
