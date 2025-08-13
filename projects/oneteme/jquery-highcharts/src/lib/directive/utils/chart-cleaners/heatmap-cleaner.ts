export function cleanHeatmapConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.heatmap;
  }

  if (options.colorAxis) {
    delete options.colorAxis;
  }

  if (options.chart?.events) {
    delete options.chart.events;
  }
}
