import { Highcharts } from './highcharts-modules';

export interface RadialBarTrackOptions {
  enabled?: boolean;
  color?: string;
}

export interface RadialBarCenterValueOptions {
  enabled?: boolean;
  fontSize?: string;
  fontWeight?: string;
}

export interface RadialBarOptions {
  track?: RadialBarTrackOptions;
  centerValue?: RadialBarCenterValueOptions;
}

export function applyRadialBarLogic(
  options: Highcharts.Options,
  config?: RadialBarOptions,
): void {
  if (!config) return;

  if (config.track && config.track.enabled !== false) {
    setupBackgroundTrackRenderer(options, config.track.color);
  }

  if (config.centerValue && config.centerValue.enabled !== false) {
    setupCenterValueHover(options, config.centerValue);
  }
}

function setupCenterValueHover(
  options: Highcharts.Options,
  config: RadialBarCenterValueOptions,
): void {
  const fontSize = config.fontSize || '20px';
  const fontWeight = config.fontWeight || '700';

  if (!options.plotOptions) {
    options.plotOptions = {};
  }
  if (!options.plotOptions.series) {
    options.plotOptions.series = {};
  }
  if (!(options.plotOptions.series as any).point) {
    (options.plotOptions.series as any).point = {};
  }
  if (!(options.plotOptions.series as any).point.events) {
    (options.plotOptions.series as any).point.events = {};
  }

  const pointEvents = (options.plotOptions.series as any).point.events;

  const originalMouseOver = pointEvents.mouseOver;
  const originalMouseOut = pointEvents.mouseOut;

  pointEvents.mouseOver = function (this: any) {
    if (originalMouseOver) {
      originalMouseOver.apply(this, arguments as any);
    }

    const chart = this.series?.chart;
    if (!chart) return;

    const centerX = chart.plotLeft + chart.plotWidth / 2;
    const centerY = chart.plotTop + chart.plotHeight / 2;
    const text = this.count ?? this.y;

    if (chart.customCenterValue) {
      chart.customCenterValue.attr({
        x: centerX,
        y: centerY,
        text: text,
      });
      chart.customCenterValue.css({
        color: this.color,
      });
      chart.customCenterValue.show();
    } else {
      chart.customCenterValue = chart.renderer
        .text(text, centerX, centerY)
        .css({
          color: this.color,
          fontSize: fontSize,
          fontWeight: fontWeight,
          textAlign: 'center',
        })
        .attr({ align: 'center', zIndex: 5 })
        .add();
    }
  };

  pointEvents.mouseOut = function (this: any) {
    if (originalMouseOut) {
      originalMouseOut.apply(this, arguments as any);
    }

    const chart = this.series?.chart;
    if (chart?.customCenterValue) {
      chart.customCenterValue.hide();
    }
  };
}

function setupBackgroundTrackRenderer(
  options: Highcharts.Options,
  trackColor?: string,
): void {
  const DEFAULT_TRACK_COLOR = '#E5E7EB';
  const color = trackColor || DEFAULT_TRACK_COLOR;

  if (!options.chart) {
    options.chart = {};
  }
  if (!options.chart.events) {
    options.chart.events = {};
  }

  const originalRender = options.chart.events.render;

  options.chart.events.render = function (this: any) {
    const chart = this;
    const series = chart.series?.[0];

    if (originalRender) {
      originalRender.apply(this, arguments as any);
    }

    if (!series?.data?.length) return;

    if (chart.customBackgroundArcs) {
      chart.customBackgroundArcs.forEach((arc: any) => {
        arc?.destroy?.();
      });
    }
    chart.customBackgroundArcs = [];

    const endAngleDeg = chart.userOptions?.pane?.endAngle ?? 360;
    const startAngleDeg = chart.userOptions?.pane?.startAngle ?? 0;
    const totalAngleDeg = endAngleDeg - startAngleDeg;
    const totalAngleRad = (totalAngleDeg * Math.PI) / 180;

    series.data.forEach((point: any) => {
      if (!point.shapeArgs) return;

      const { x: cx, y: cy, r, innerR, start } = point.shapeArgs;
      const end = start + totalAngleRad;
      const thickness = r - innerR;
      const capRadius = thickness / 2;
      const midR = (r + innerR) / 2;

      const capAngle = capRadius / midR;
      const adjustedStart = start + capAngle;
      const adjustedEnd = end - capAngle;

      const effectiveAngleRad = adjustedEnd - adjustedStart;
      const effectiveAngleDeg = (effectiveAngleRad * 180) / Math.PI;

      const largeArcFlag = effectiveAngleDeg > 180 ? 1 : 0;

      const startOuterX = cx + r * Math.cos(adjustedStart);
      const startOuterY = cy + r * Math.sin(adjustedStart);
      const startInnerX = cx + innerR * Math.cos(adjustedStart);
      const startInnerY = cy + innerR * Math.sin(adjustedStart);
      const endOuterX = cx + r * Math.cos(adjustedEnd);
      const endOuterY = cy + r * Math.sin(adjustedEnd);
      const endInnerX = cx + innerR * Math.cos(adjustedEnd);
      const endInnerY = cy + innerR * Math.sin(adjustedEnd);

      const path = [
        'M',
        startInnerX,
        startInnerY,
        'A',
        capRadius,
        capRadius,
        0,
        0,
        1,
        startOuterX,
        startOuterY,
        'A',
        r,
        r,
        0,
        largeArcFlag,
        1,
        endOuterX,
        endOuterY,
        'A',
        capRadius,
        capRadius,
        0,
        0,
        1,
        endInnerX,
        endInnerY,
        'A',
        innerR,
        innerR,
        0,
        largeArcFlag,
        0,
        startInnerX,
        startInnerY,
        'Z',
      ];

      const arc = chart.renderer
        .path(path)
        .attr({
          fill: color,
          zIndex: 0,
        })
        .add(series.group);

      if (arc.element && point.graphic?.element) {
        arc.element.parentNode.insertBefore(arc.element, point.graphic.element);
      }

      chart.customBackgroundArcs.push(arc);
    });
  };
}
