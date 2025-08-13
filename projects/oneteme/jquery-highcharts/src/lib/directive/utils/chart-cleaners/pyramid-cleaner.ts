export function cleanPyramidConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.pyramid;
    delete options.plotOptions.funnel;
  }

  if (options.chart?.events) {
    delete options.chart.events;
  }
}
