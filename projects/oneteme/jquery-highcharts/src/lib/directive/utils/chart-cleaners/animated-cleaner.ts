export function cleanAnimatedConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.funnel;
    delete options.plotOptions.pyramid;
    delete options.plotOptions.heatmap;
  }

  if (options.chart?.events) {
    delete options.chart.events;
  }
}
