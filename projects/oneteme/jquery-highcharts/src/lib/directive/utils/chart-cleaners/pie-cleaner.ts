export function cleanPieConfigs(options: any): void {
  if (options.plotOptions) {
    delete options.plotOptions.pie;

    if (options.plotOptions.series) {
      delete options.plotOptions.series.innerSize;
      delete options.plotOptions.series.borderRadius;
      delete options.plotOptions.series.startAngle;
      delete options.plotOptions.series.endAngle;
      delete options.plotOptions.series.center;
      delete options.plotOptions.series.size;
      delete options.plotOptions.series.slicedOffset;
      delete options.plotOptions.series.allowPointSelect;
      delete options.plotOptions.series.cursor;
      delete options.plotOptions.series.dataLabels;
    }
  }
}
