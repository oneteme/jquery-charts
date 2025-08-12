export function cleanBasicConfigs(options: any): void {
  cleanChartConfig(options);
  cleanAxisConfigs(options);
  cleanPlotOptionsConfigs(options);
  cleanTooltipConfig(options);
  cleanLegendConfig(options);
}

function cleanChartConfig(options: any): void {
  if (options.chart) {
    delete options.chart.polar;
    delete options.chart.inverted;
    delete options.chart.events;
  }

  if (options.pane) {
    delete options.pane;
  }

  if (options.colorAxis) {
    delete options.colorAxis;
  }
}

function cleanAxisConfigs(options: any): void {
  if (options.xAxis) {
    if (Array.isArray(options.xAxis)) {
      options.xAxis.forEach(axis => cleanBasicAxisConfig(axis));
    } else {
      cleanBasicAxisConfig(options.xAxis);
    }
  }

  if (options.yAxis) {
    if (Array.isArray(options.yAxis)) {
      options.yAxis.forEach(axis => cleanBasicAxisConfig(axis));
    } else {
      cleanBasicAxisConfig(options.yAxis);
    }
  }
}

function cleanPlotOptionsConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.pie;
    delete options.plotOptions.scatter;
    delete options.plotOptions.bubble;
    delete options.plotOptions.treemap;
    delete options.plotOptions.heatmap;
    delete options.plotOptions.boxplot;
    delete options.plotOptions.funnel;
    delete options.plotOptions.pyramid;

    if (options.plotOptions.series) {
      delete options.plotOptions.series.pointPlacement;
      delete options.plotOptions.series.pointStart;
      delete options.plotOptions.series.connectEnds;
      delete options.plotOptions.series.fillOpacity;
      delete options.plotOptions.series.innerSize;
      delete options.plotOptions.series.borderRadius;
      delete options.plotOptions.series.marker;
      delete options.plotOptions.series.minSize;
      delete options.plotOptions.series.maxSize;
      delete options.plotOptions.series.stickyTracking;
      delete options.plotOptions.series.findNearestPointBy;
      delete options.plotOptions.series.states;
      delete options.plotOptions.series.allowPointSelect;
      delete options.plotOptions.series.cursor;
      delete options.plotOptions.series.dataLabels;
    }
  }
}

function cleanTooltipConfig(options: any): void {
  if (options.tooltip) {
    delete options.tooltip.headerFormat;
    delete options.tooltip.pointFormat;
    delete options.tooltip.shared;
    delete options.tooltip.followPointer;
    delete options.tooltip.formatter;
  }
}

function cleanLegendConfig(options: any): void {
  if (options.legend) {
    delete options.legend.enabled;
  }
}

function cleanBasicAxisConfig(axis: any): void {
  if (!axis) return;

  delete axis.tickmarkPlacement;
  delete axis.gridLineInterpolation;
  delete axis.reversedStacks;
}
