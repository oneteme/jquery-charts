export function cleanScatterBubbleConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.scatter;
    delete options.plotOptions.bubble;
  }

  if (options.tooltip) {
    delete options.tooltip.headerFormat;
    delete options.tooltip.pointFormat;
    delete options.tooltip.shared;
    delete options.tooltip.followPointer;
  }
}
