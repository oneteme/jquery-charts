import { Highcharts } from '../directive/utils/highcharts-modules';

describe('highcharts-modules (basiques)', () => {
  it('Highcharts est défini et expose getOptions()', () => {
    expect(Highcharts).toBeTruthy();
    expect(typeof (Highcharts as any).getOptions).toBe('function');
  });

  it('Highcharts.getOptions().colors est un tableau', () => {
    const colors = (Highcharts as any).getOptions().colors;
    expect(Array.isArray(colors)).toBeTrue();
    expect(colors.length).toBeGreaterThan(0);
  });
});
