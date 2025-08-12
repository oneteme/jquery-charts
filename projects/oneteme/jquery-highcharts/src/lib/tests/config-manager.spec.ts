import { ConfigurationManager } from '../directive/utils/config-manager';

describe('ConfigurationManager', () => {
  it('applyUserConfigWithTransformation: applique innerSize pour pie/donut et conserve title/subtitle', () => {
    const base: any = { title: { text: 'T' }, subtitle: { text: 'S' }, plotOptions: {} };
    const user: any = { options: { plotOptions: { series: { dataLabels: { enabled: false } } } } };

    const outPie = ConfigurationManager.applyUserConfigWithTransformation(base, user, 'pie', false);
    expect(outPie.plotOptions?.pie?.innerSize).toBe(0);
    expect(outPie.title?.text).toBe('T');
    expect(outPie.subtitle?.text).toBe('S');

    const base2: any = { title: { text: 'T2' }, subtitle: { text: 'S2' }, plotOptions: {} };
    const outDonut = ConfigurationManager.applyUserConfigWithTransformation(base2, user, 'donut', false);
    expect(outDonut.plotOptions?.pie?.innerSize).toBe('50%');
    expect(outDonut.title?.text).toBe('T2');
    expect(outDonut.subtitle?.text).toBe('S2');
  });

  it('handlePolarChartSpecifics: active chart.polar pour types polaires', () => {
    const options: any = { chart: {} };
    const changed = ConfigurationManager.handlePolarChartSpecifics(options, 'radar', false);
    expect(changed).toBeTrue();
    expect(options.chart.polar).toBeTrue();
  });
});
