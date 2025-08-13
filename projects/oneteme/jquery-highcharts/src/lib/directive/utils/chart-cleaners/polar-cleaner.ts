export function cleanPolarConfigs(options: any): void {
  if (options.chart) {
    delete options.chart.polar;
    delete options.chart.inverted;
  }

  if (options.pane) {
    delete options.pane;
  }

  if (options.xAxis) {
    if (Array.isArray(options.xAxis)) {
      options.xAxis.forEach(axis => cleanAxisConfig(axis));
    } else {
      cleanAxisConfig(options.xAxis);
    }
  }

  if (options.yAxis) {
    if (Array.isArray(options.yAxis)) {
      options.yAxis.forEach(axis => cleanAxisConfig(axis));
    } else {
      cleanAxisConfig(options.yAxis);
    }
  }

  if (options.plotOptions) {
    delete options.plotOptions.column;
    delete options.plotOptions.line;
    delete options.plotOptions.area;

    if (options.plotOptions.series) {
      delete options.plotOptions.series.pointPlacement;
      delete options.plotOptions.series.pointStart;
      delete options.plotOptions.series.connectEnds;
      delete options.plotOptions.series.marker;
      delete options.plotOptions.series.fillOpacity;
    }
  }

  if (options.legend) {
    delete options.legend.enabled;
  }
}

function cleanAxisConfig(axis: any): void {
  if (!axis) return;

  delete axis.tickmarkPlacement;
  delete axis.lineWidth;
  delete axis.gridLineWidth;
  delete axis.gridLineInterpolation;
  delete axis.reversedStacks;
}
