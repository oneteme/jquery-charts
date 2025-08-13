import { SimpleChartHandlerFactory } from '../directive/utils/charts-handlers/simple-handlers';

describe('SimpleChartHandlerFactory (basique)', () => {
  it('retourne un handler pour pie/donut/radar/polar', () => {
    expect(SimpleChartHandlerFactory.getHandler('pie')).toBeTruthy();
    expect(SimpleChartHandlerFactory.getHandler('donut')).toBeTruthy();
    expect(SimpleChartHandlerFactory.getHandler('radar')).toBeTruthy();
    expect(SimpleChartHandlerFactory.getHandler('polar')).toBeTruthy();
  });

  it('retourne undefined pour un type inconnu', () => {
    expect(SimpleChartHandlerFactory.getHandler('unknown' as any)).toBeNull();
  });

  it('getSupportedTypes() retourne une liste non vide', () => {
    const types = SimpleChartHandlerFactory.getSupportedTypes();
    expect(Array.isArray(types)).toBeTrue();
    expect(types.length).toBeGreaterThan(0);
  });
});
