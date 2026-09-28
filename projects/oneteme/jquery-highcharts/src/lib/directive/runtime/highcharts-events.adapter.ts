import { Highcharts } from '../utils/highcharts-modules';

export interface HighchartsRuntimeEventHandlers {
  render?: (chart: Highcharts.Chart) => void;
  pointClick?: (event: any) => void;
  pointMouseOver?: (point: any) => void;
  pointMouseOut?: (point: any) => void;
  seriesVisibility?: (series: Highcharts.Series, visible: boolean) => void;
  selection?: (event: any) => boolean | void;
  afterSetExtremes?: (event: any, xAxisIndex: number) => void;
}

export function applyHighchartsRuntimeEvents(
  options: Highcharts.Options,
  handlers: HighchartsRuntimeEventHandlers,
): void {
  options.chart ??= {};
  options.chart.events ??= {};

  const originalRender = options.chart.events.render;
  const originalSelection = options.chart.events.selection;
  const plotOptions = (options.plotOptions ??= {}) as any;
  const originalSeries = plotOptions.series ?? {};
  const originalPointEvents = originalSeries.point?.events ?? {};
  const originalSeriesEvents = originalSeries.events ?? {};

  options.chart.events.render = function (this: Highcharts.Chart) {
    if (typeof originalRender === 'function') {
      originalRender.apply(this, arguments as any);
    }
    handlers.render?.(this);
  };

  plotOptions.series = {
    ...originalSeries,
    events: {
      ...originalSeriesEvents,
      hide: function (this: Highcharts.Series, event: any) {
        if (typeof originalSeriesEvents.hide === 'function') {
          originalSeriesEvents.hide.call(this, event);
        }
        handlers.seriesVisibility?.(this, false);
      },
      show: function (this: Highcharts.Series, event: any) {
        if (typeof originalSeriesEvents.show === 'function') {
          originalSeriesEvents.show.call(this, event);
        }
        handlers.seriesVisibility?.(this, true);
      },
    },
    point: {
      ...(originalSeries.point ?? {}),
      events: {
        ...originalPointEvents,
        click: function (this: Highcharts.Point, event: any) {
          const point = event?.point ?? this;
          if (typeof originalPointEvents.click === 'function') {
            originalPointEvents.click.call(point, event);
          }
          handlers.pointClick?.({ ...event, point });
        },
        mouseOver: function (this: Highcharts.Point, event: any) {
          const point = event?.point ?? this;
          if (typeof originalPointEvents.mouseOver === 'function') {
            originalPointEvents.mouseOver.call(point, event);
          }
          handlers.pointMouseOver?.(point);
        },
        mouseOut: function (this: Highcharts.Point, event: any) {
          const point = event?.point ?? this;
          if (typeof originalPointEvents.mouseOut === 'function') {
            originalPointEvents.mouseOut.call(point, event);
          }
          handlers.pointMouseOut?.(point);
        },
      },
    },
  };

  options.chart.events.selection = function (this: Highcharts.Chart, event: any) {
    const accepted = typeof originalSelection === 'function'
      ? originalSelection.call(this, event)
      : true;
    if (accepted === false) return false;
    if (handlers.selection?.(event) === false) return false;
    return accepted;
  };

  if (handlers.afterSetExtremes) {
    const xAxisOptions = Array.isArray(options.xAxis)
      ? options.xAxis
      : options.xAxis
        ? [options.xAxis]
        : [];

    xAxisOptions.forEach((xAxisOptions, xAxisIndex) => {
      const originalAfterSetExtremes = (xAxisOptions as any).events?.afterSetExtremes;
      const afterSetExtremes = function (this: Highcharts.Axis, event: any) {
        if (typeof originalAfterSetExtremes === 'function') {
          originalAfterSetExtremes.call(this, event);
        }
        handlers.afterSetExtremes?.(event, xAxisIndex);
      };
      const originalXAxisEvents = (xAxisOptions as any).events;
      (xAxisOptions as any).events = originalXAxisEvents
        ? { ...originalXAxisEvents, afterSetExtremes }
        : { afterSetExtremes };
    });
  }
}
