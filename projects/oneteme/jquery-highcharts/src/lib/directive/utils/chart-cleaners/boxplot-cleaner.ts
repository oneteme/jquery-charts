export function cleanBoxplotConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.boxplot;
  }

  if (options.tooltip) {
    delete options.tooltip.headerFormat;
    delete options.tooltip.pointFormat;
    delete options.tooltip.shared;
  }
}
