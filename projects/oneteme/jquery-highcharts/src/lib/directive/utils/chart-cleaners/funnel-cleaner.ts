export function cleanFunnelConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.funnel;
  }
  
  if (options.chart?.events) {
    delete options.chart.events;
  }
}
