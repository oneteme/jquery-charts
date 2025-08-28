import { PieHandler } from '../directive/utils/charts-handlers/simple-handlers';

describe('PieHandler (basique)', () => {
  it('retourne série vide si commonChart.series est absent ou invalide', () => {
    const h = new PieHandler();
    const out1 = h.handle(undefined as any, {} as any, 'pie', false);
    expect(out1.series).toEqual([]);

    const out2 = h.handle({ series: null } as any, {} as any, 'pie', false);
    expect(out2.series).toEqual([]);

    const out3 = h.handle({ series: {} } as any, {} as any, 'pie', false);
    expect(out3.series).toEqual([]);
  });
});
