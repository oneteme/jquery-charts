import { sanitizeChartDimensions } from '../directive/utils/chart-utils';

describe('sanitizeChartDimensions (basique)', () => {
  it('applique width/height numériques, supprime valeurs non-numériques', () => {
    const options: any = { chart: { width: '100%', height: 'auto' } };
    const cfg: any = { width: 800, height: 400 };

    sanitizeChartDimensions(options, cfg);
    expect(options.chart.width).toBe(800);
    expect(options.chart.height).toBe(400);

    // valeurs invalides
    sanitizeChartDimensions(options, { width: undefined, height: undefined } as any);
    expect(typeof options.chart.width).toBe('number');
    expect(typeof options.chart.height).toBe('number');

    // si options contient des strings, elles sont supprimées
    const opts2: any = { chart: { width: '100%', height: 'auto' } };
    sanitizeChartDimensions(opts2, { } as any);
    expect(opts2.chart.width).toBeUndefined();
    expect(opts2.chart.height).toBeUndefined();
  });
});
