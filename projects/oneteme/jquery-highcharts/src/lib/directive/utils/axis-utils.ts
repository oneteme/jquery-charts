import { Highcharts } from './highcharts-modules';

export function applyAxisOffsets(options: Highcharts.Options): void {
  if (!options.yAxis || !options.series) return;

  const yAxes = Array.isArray(options.yAxis) ? options.yAxis : [options.yAxis];

  yAxes.forEach((yAxis: any, index: number) => {
    if (yAxis.maxOffset === undefined) return;
    if (yAxis.max !== undefined) return;

    const dataMax = calculateMaxFromSeriesOptions(options.series, index);

    if (dataMax !== null) {
      const handled = applySmallMaxPrecision(yAxis, dataMax);
      if (handled) {
        return;
      }
    }

    if (dataMax !== null) {
      const offset = typeof yAxis.maxOffset === 'number' ? yAxis.maxOffset : 0;
      const effectiveOffset =
        dataMax > 0 ? Math.min(offset, dataMax * 0.01) : offset;

      const rawMax = dataMax + effectiveOffset;
      let finalMax = rawMax;

      const roundingStep =
        typeof yAxis.maxRounding === 'number'
          ? yAxis.maxRounding
          : yAxis.tickInterval;

      if (typeof roundingStep === 'number' && roundingStep > 0) {
        const divisors = [1, 2, 4, 5, 10];
        let bestMax = Number.MAX_VALUE;
        let found = false;

        for (const div of divisors) {
          const step = roundingStep / div;
          if (!Number.isInteger(step)) continue;

          let candidateMax = Math.ceil(rawMax / step) * step;

          if (typeof yAxis.tickAmount === 'number' && yAxis.tickAmount > 1) {
            const min = typeof yAxis.min === 'number' ? yAxis.min : 0;
            const intervals = yAxis.tickAmount - 1;

            let attempts = 0;
            while ((candidateMax - min) % intervals !== 0 && attempts < 20) {
              candidateMax += step;
              attempts++;
            }
            if (attempts >= 20) continue;
          }

          if (candidateMax < bestMax) {
            bestMax = candidateMax;
            found = true;
          }
        }

        if (found) {
          finalMax = bestMax;
        } else {
          finalMax = Math.ceil(rawMax / roundingStep) * roundingStep;
        }

        yAxis.max = finalMax;

        if (typeof yAxis.tickAmount === 'number' && yAxis.tickAmount > 1) {
          const min = typeof yAxis.min === 'number' ? yAxis.min : 0;
          const range = finalMax - min;
          yAxis.tickInterval = range / (yAxis.tickAmount - 1);
        }
      } else {
        yAxis.max = finalMax;

        if (yAxis.endOnTick === undefined) {
          yAxis.endOnTick = false;
        }
      }
    }
  });
}

function applySmallMaxPrecision(yAxis: any, dataMax: number): boolean {
  const threshold =
    typeof yAxis.smallMaxThreshold === 'number' ? yAxis.smallMaxThreshold : null;

  if (threshold === null || dataMax > threshold) return false;

  const min = typeof yAxis.min === 'number' ? yAxis.min : 0;
  const range = Math.max(dataMax - min, 0);
  const tickCount =
    typeof yAxis.smallMaxTickCount === 'number'
      ? yAxis.smallMaxTickCount
      : typeof yAxis.tickAmount === 'number'
        ? yAxis.tickAmount
        : 5;

  if (range > 0 && tickCount > 1) {
    const rawStep = range / (tickCount - 1);
    const step = Math.max(1, Math.ceil(rawStep));
    const finalMax = min + step * (tickCount - 1);

    yAxis.max = finalMax;
    yAxis.endOnTick = true;
    yAxis.tickAmount = tickCount;
    yAxis.tickInterval = step;
    if (typeof yAxis.smallMaxMinTickInterval === 'number') {
      yAxis.minTickInterval = yAxis.smallMaxMinTickInterval;
    }

    if (!yAxis.labels) {
      yAxis.labels = {};
    }
    if (!yAxis.labels.formatter && !yAxis.labels.format) {
      yAxis.labels.format = '{value:.0f}';
    }
    return true;
  }

  return false;
}

function calculateMaxFromSeriesOptions(
  series: Highcharts.SeriesOptionsType[] | undefined,
  yAxisIndex: number,
): number | null {
  if (!series?.length) return null;

  let globalMax: number | null = null;

  series.forEach((s: any) => {
    if (s.visible === false) return;

    const serieAxisIndex = s.yAxis ?? 0;
    if (serieAxisIndex !== yAxisIndex) return;

    const data = s.data;
    if (!Array.isArray(data) || data.length === 0) return;

    data.forEach((point: any) => {
      let val: number | null = null;

      if (typeof point === 'number') {
        val = point;
      } else if (Array.isArray(point)) {
        if (point.length > 1 && typeof point[1] === 'number') {
          val = point[1];
        }
      } else if (typeof point === 'object' && point !== null) {
        if (typeof point.y === 'number') {
          val = point.y;
        } else if (typeof point.high === 'number') {
          val = point.high;
        }
      }

      if (val !== null && !isNaN(val)) {
        if (globalMax === null || val > globalMax) {
          globalMax = val;
        }
      }
    });
  });

  return globalMax;
}
