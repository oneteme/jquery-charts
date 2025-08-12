import { determineXAxisDataType, getActualHighchartsType, isPolarChartType, isSimpleChartType } from '../directive/utils/chart-utils';

describe('chart-utils (basiques)', () => {
  it('determineXAxisDataType', () => {
    expect(determineXAxisDataType(new Date())).toBe('datetime');
    expect(determineXAxisDataType(42)).toBe('numeric');
    expect(determineXAxisDataType('a')).toBe('category');
  });

  it('isPolarChartType et isSimpleChartType', () => {
    expect(isPolarChartType('radar')).toBeTrue();
    expect(isPolarChartType('heatmap')).toBeFalse();
    expect(isSimpleChartType('donut')).toBeTrue();
    expect(isSimpleChartType('column')).toBeFalse();
  });

  it('getActualHighchartsType mapping', () => {
    expect(getActualHighchartsType('donut')).toBe('pie');
    expect(getActualHighchartsType('polar')).toBe('column');
    expect(getActualHighchartsType('radar')).toBe('line');
    expect(getActualHighchartsType('radarArea')).toBe('area');
    expect(getActualHighchartsType('column')).toBe('column');
  });
});
