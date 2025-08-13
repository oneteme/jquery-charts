import { unifyPlotOptionsForChart } from '../directive/utils/types';

describe('unifyPlotOptionsForChart', () => {
  it('déplace series.innerSize vers plotOptions.pie.innerSize pour pie/donut', () => {
    const opts: any = { plotOptions: { series: { innerSize: '60%' } } };
    unifyPlotOptionsForChart(opts, 'donut' as any, false);
    expect(opts.plotOptions.pie?.innerSize).toBe('60%');
  });

  it('laisse les propriétés à même niveau pour radar/polar', () => {
    const opts: any = { plotOptions: { series: { pointPlacement: 'between', marker: { enabled: true } } } };
    unifyPlotOptionsForChart(opts, 'radar' as any, false);
    expect(opts.plotOptions.series?.pointPlacement).toBe('between');
    expect(opts.plotOptions.series?.marker?.enabled).toBeTrue();
  });
});
