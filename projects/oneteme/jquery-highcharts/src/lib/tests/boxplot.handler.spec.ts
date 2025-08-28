import { BoxplotHandler } from '../directive/utils/charts-handlers/complex-handlers/boxplot.handler';

describe('BoxplotHandler', () => {
  it('fallback: doit produire une série boxplot avec points [x,low,q1,median,q3,high]', () => {
    const handler = new BoxplotHandler();
    const data = [
      {
        name: 'S1',
        data: [
          { low: 1, q1: 2, median: 3, q3: 4, high: 5 },
          [1, 2, 3, 4, 5, 6],
          { value: 10 },
        ],
      },
    ];

    const cfg: any = { title: 'Box', xtitle: 'X', ytitle: 'Y' };
    const out = handler.handle(data as any, cfg, false);

    expect(out.series?.[0]?.type).toBe('boxplot');
    const points = out.series?.[0]?.data as any[];
    expect(Array.isArray(points)).toBeTrue();
    expect(points.length).toBe(3);

    // Tous les points doivent pouvoir être lus comme tableaux de longueur >= 6 après normalisation
    points.forEach((pt: any) => {
      const arr = Array.isArray(pt) ? pt : [];
      expect(arr.length).toBeGreaterThanOrEqual(6);
    });
  });
});
