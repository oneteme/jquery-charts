import { sanitizeChartDimensions } from './dimensions';

describe('sanitizeChartDimensions', () => {
  it('crée l\'objet chart lorsqu\'il est absent', () => {
    const options: any = {};
    sanitizeChartDimensions(options, {} as any);
    expect(options.chart).toEqual({});
  });

  it('ne modifie pas le chart existant sans dimensions', () => {
    const options: any = { chart: { backgroundColor: '#fff' } };
    sanitizeChartDimensions(options, {} as any);
    expect(options.chart).toEqual({ backgroundColor: '#fff' });
  });

  it('applique une largeur et une hauteur numériques', () => {
    const options: any = { chart: {} };
    sanitizeChartDimensions(options, { width: 800, height: 400 } as any);
    expect(options.chart.width).toBe(800);
    expect(options.chart.height).toBe(400);
  });

  it('accepte la valeur zéro comme dimension', () => {
    const options: any = { chart: {} };
    sanitizeChartDimensions(options, { width: 0, height: 0 } as any);
    expect(options.chart.width).toBe(0);
    expect(options.chart.height).toBe(0);
  });

  it('ignore une dimension NaN', () => {
    const options: any = { chart: {} };
    sanitizeChartDimensions(options, { width: NaN, height: NaN } as any);
    expect('width' in options.chart).toBeFalse();
    expect('height' in options.chart).toBeFalse();
  });

  it('ignore les dimensions non numériques', () => {
    const options: any = { chart: {} };
    sanitizeChartDimensions(options, { width: '800', height: '400px' } as any);
    expect('width' in options.chart).toBeFalse();
    expect('height' in options.chart).toBeFalse();
  });

  it('ignore les dimensions absentes ou nulles', () => {
    const options: any = { chart: {} };
    sanitizeChartDimensions(options, { width: undefined, height: null } as any);
    expect(options.chart).toEqual({});
  });

  it('applique une seule dimension sans toucher à l\'autre', () => {
    const options: any = { chart: { height: 300 } };
    sanitizeChartDimensions(options, { width: 500 } as any);
    expect(options.chart).toEqual({ height: 300, width: 500 });
  });
});
