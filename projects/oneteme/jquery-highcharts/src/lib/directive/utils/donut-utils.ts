import { Highcharts } from './highcharts-modules';

export interface DonutCenterOptions {
  enabled?: boolean;
  title?: string;
  labelColor?: string;
  valueColor?: string;
  labelFontSize?: string;
  valueFontSize?: string;
}

export function applyDonutCenterLogic(options: Highcharts.Options, donutConfig?: DonutCenterOptions): void {
  if (donutConfig && donutConfig.enabled === false) return;

  // Default values
  const defaultTitle = donutConfig?.title || 'Total';
  const labelColor = donutConfig?.labelColor || '#666';
  const valueColor = donutConfig?.valueColor || '#333';
  const labelFontSize = donutConfig?.labelFontSize || '14px';
  const valueFontSize = donutConfig?.valueFontSize || '28px';

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

    const total = series.points
      .filter((p: any) => p.visible)
      .reduce((sum: number, point: any) => sum + point.y, 0);

    const selectedPoint = series.points.find((p: any) => p.sliced && p.visible);

    const labelText = selectedPoint ? selectedPoint.name : defaultTitle;
    const valueText = selectedPoint
      ? (Highcharts.numberFormat(selectedPoint.y, 0, ' ', ' '))
      : (Highcharts.numberFormat(total, 0, ' ', ' '));

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
            y: centerY + yOffset,
            text: text,
          });
          chart[key].toFront();
        } else {
          chart[key] = this.renderer
            .text(text, centerX, centerY + yOffset)
            .css({ color, fontSize, fontWeight, textAlign: 'center' })
            .attr({ align: 'center', zIndex: 10 })
            .add();
        }
      };

      drawLabel('customLabel', labelText, -17, labelFontSize, '400', labelColor);
      drawLabel('customTotalLabel', valueText, 13, valueFontSize, '700', valueColor);
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

    if (chart.customLabel) {
      chart.customLabel.attr({ text: point.name });
    }
    if (chart.customTotalLabel) {
      chart.customTotalLabel.attr({ text: Highcharts.numberFormat(point.y, 0, ' ', ' ') });
    }

    if (originalMouseOver) originalMouseOver.apply(this, arguments as any);
  };
  anyOptions.plotOptions.series.point.events.mouseOver = pointMouseOver;

  const pointMouseOut = function (this: any) {
    const point = this as any;
    const chart = point.series.chart as any;
    const series = point.series;

    const total = series.points
        .filter((p: any) => p.visible)
        .reduce((sum: number, point: any) => sum + point.y, 0);
    const selectedPoint = series.points.find(
        (p: any) => p.sliced && p.visible,
    );
    const labelText = selectedPoint ? selectedPoint.name : defaultTitle;
    const valueText = selectedPoint
        ? (Highcharts.numberFormat(selectedPoint.y, 0, ' ', ' '))
        : (Highcharts.numberFormat(total, 0, ' ', ' '));

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
