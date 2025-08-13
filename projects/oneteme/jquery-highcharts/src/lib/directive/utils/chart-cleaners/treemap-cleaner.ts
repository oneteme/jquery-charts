export function cleanTreemapConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.treemap;
  }

  if (options.colorAxis) {
    delete options.colorAxis;
  }
}
