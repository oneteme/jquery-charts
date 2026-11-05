import * as echarts from 'echarts';
import { rangeConfigurator } from './range-config';
import { applyCommonConfig } from '../chart-utils';

const config = (): any => ({ series: [{ name: 'S', data: { x: (o: any) => o.c, y: (o: any) => [o.lo, o.hi] } }] });

function render(rows: any[], type: 'rangeColumn' | 'rangeArea' = 'rangeColumn') {
  const model = rangeConfigurator.buildChartData(rows, config(), type);
  const option: any = rangeConfigurator.buildOption(model, type, config());
  const host = document.createElement('div');
  host.style.width = '640px';
  host.style.height = '420px';
  document.body.appendChild(host);
  const instance = echarts.init(host, undefined, { renderer: 'canvas', animation: false } as any);
  instance.setOption({ ...option, animation: false }, { notMerge: true });
  return { instance, option, dispose: () => { instance.dispose(); host.remove(); } };
}

/** Valeurs (min, max) couvertes par la barre visible de la série d'index `seriesIndex` pour la catégorie `dataIndex`. */
function barSpan(instance: echarts.ECharts, seriesIndex: number, dataIndex: number): [number, number] {
  const model: any = (instance as any).getModel();
  const layout: any = model.getSeriesByIndex(seriesIndex).getData().getItemLayout(dataIndex);
  const a = instance.convertFromPixel({ yAxisIndex: 0 }, layout.y) as number;
  const b = instance.convertFromPixel({ yAxisIndex: 0 }, layout.y + layout.height) as number;
  return [Math.min(a, b), Math.max(a, b)];
}

describe('rangeConfigurator', () => {
  it('supporte les types range et refuse les autres', () => {
    expect(rangeConfigurator.supports('rangeBar')).toBeTrue();
    expect(rangeConfigurator.supports('rangeArea')).toBeTrue();
    expect(rangeConfigurator.supports('bar')).toBeFalse();
  });

  it('produit une base transparente puis une série visible par série de données', () => {
    const { option, dispose } = render([{ c: 'A', lo: 1, hi: 4 }]);
    expect(option.series.length).toBe(2);
    expect(option.series[0].itemStyle.opacity).toBe(0);
    expect(option.series[0].data).toEqual([1]);
    expect(option.series[1].data).toEqual([3]);
    dispose();
  });

  it('affiche une plage entièrement positive entre min et max', () => {
    const { instance, dispose } = render([{ c: 'A', lo: 1, hi: 4 }]);
    const [low, high] = barSpan(instance, 1, 0);
    expect(low).toBeCloseTo(1, 1);
    expect(high).toBeCloseTo(4, 1);
    dispose();
  });

  it('couvre de min à max une plage qui traverse zéro (-2 → 4) avec deux segments', () => {
    const { instance, option, dispose } = render([{ c: 'A', lo: -2, hi: 4 }]);
    // Segment positif (visible) : 0 → 4 ; segment négatif (série dédiée, même pile) : -2 → 0
    const [positiveLow, positiveHigh] = barSpan(instance, 1, 0);
    const [negativeLow, negativeHigh] = barSpan(instance, 2, 0);
    expect(positiveLow).toBeCloseTo(0, 1);
    expect(positiveHigh).toBeCloseTo(4, 1);
    expect(negativeLow).toBeCloseTo(-2, 1);
    expect(negativeHigh).toBeCloseTo(0, 1);
    expect(option.series.length).toBe(3);
    dispose();
  });

  it('couvre de min à max une plage entièrement négative (-5 → -2)', () => {
    const { instance, dispose } = render([{ c: 'A', lo: -5, hi: -2 }]);
    const [low, high] = barSpan(instance, 1, 0);
    expect(low).toBeCloseTo(-5, 1);
    expect(high).toBeCloseTo(-2, 1);
    dispose();
  });

  it('n\'ajoute pas de segment négatif quand aucune plage ne traverse zéro', () => {
    const { option, dispose } = render([{ c: 'A', lo: 1, hi: 4 }]);
    expect(option.series.length).toBe(2);
    dispose();
  });

  it('empile une aire qui traverse zéro en cumul : base -2 puis épaisseur 6', () => {
    const { option, dispose } = render([{ c: 'A', lo: -2, hi: 4 }], 'rangeArea');
    expect(option.series[0].data).toEqual([-2]);
    expect(option.series[1].data).toEqual([6]);
    dispose();
  });

  it('laisse null une valeur absente (null) sans produire de hauteur négative', () => {
    const option: any = rangeConfigurator.buildOption(
      { categories: ['A'], series: [{ name: 'S', data: [[2, null]] }] } as any,
      'rangeColumn',
      config()
    );
    expect(option.series[1].data[0]).toBeNull();
  });

  describe('mode continu', () => {
    const continuous = { ...config(), continue: true };
    const continuousOption = (rows: any[], type: 'rangeColumn' | 'rangeArea' = 'rangeColumn'): any => {
      const model = rangeConfigurator.buildChartData(rows, continuous, type);
      return rangeConfigurator.buildOption(model, type, continuous);
    };

    it('lit la plage dans y et produit des couples [x, base] puis [x, épaisseur] pour une colonne', () => {
      const option = continuousOption([{ c: 1, lo: 1, hi: 4 }, { c: 2, lo: 2, hi: 5 }]);
      expect(option.series[0].data).toEqual([[1, 1], [2, 2]]);
      expect(option.series[1].data).toEqual([[1, 3], [2, 3]]);
    });

    it('garde les couples [x, valeur] pour une aire', () => {
      const option = continuousOption([{ c: 1, lo: -2, hi: 4 }], 'rangeArea');
      expect(option.series[0].data).toEqual([[1, -2]]);
      expect(option.series[1].data).toEqual([[1, 6]]);
    });

    it('garde des valeurs simples pour un rangeBar horizontal', () => {
      const option: any = rangeConfigurator.buildOption(
        { categories: ['A'], series: [{ name: 'S', data: [{ x: 1, y: [2, 5] }] }] } as any,
        'rangeBar',
        continuous
      );
      expect(option.series[1].data).toEqual([3]);
    });
  });

  describe('tooltip', () => {
    const optionOf = (rows: any[], type: 'rangeColumn' | 'rangeArea' = 'rangeColumn'): any => {
      const model = rangeConfigurator.buildChartData(rows, config(), type);
      return rangeConfigurator.buildOption(model, type, config());
    };
    const param = (seriesIndex: number, dataIndex = 0, extra: any = {}) => ({
      seriesIndex,
      dataIndex,
      seriesName: 'S',
      value: 0,
      marker: '',
      ...extra,
    });

    it('affiche les bornes min – max et ignore la base transparente', () => {
      const option = optionOf([{ c: 'A', lo: 1, hi: 4 }]);
      const html: string = option.tooltip.formatter([
        param(0, 0, { axisValueLabel: 'A', seriesName: 'S (base)' }),
        param(1, 0, { seriesName: 'S' }),
      ]);
      expect(html).toBe('A<br/>S: 1 – 4');
    });

    it('n\'affiche qu\'une ligne par série pour une plage qui traverse zéro (segment négatif ignoré)', () => {
      const option = optionOf([{ c: 'A', lo: -2, hi: 4 }]);
      const html: string = option.tooltip.formatter([
        param(0, 0, { axisValueLabel: 'A', seriesName: 'S (base)' }),
        param(1, 0, { seriesName: 'S' }),
        param(2, 0, { seriesName: 'S' }),
      ]);
      expect(html).toBe('A<br/>S: -2 – 4');
    });

    it('ajoute l\'unité de la série aux bornes', () => {
      const option: any = rangeConfigurator.buildOption(
        { categories: ['A'], series: [{ name: 'S', unit: 'ms', data: [[2, 5]] }] } as any,
        'rangeColumn',
        config()
      );
      const html: string = option.tooltip.formatter([param(1, 0, { axisValueLabel: 'A' })]);
      expect(html).toBe('A<br/>S: 2 – 5 ms');
    });

    it('affiche les bornes d\'une aire (série d\'épaisseur visible)', () => {
      const option = optionOf([{ c: 'A', lo: -2, hi: 4 }], 'rangeArea');
      const html: string = option.tooltip.formatter([
        param(0, 0, { axisValueLabel: 'A', seriesName: 'S (min)' }),
        param(1, 0, { seriesName: 'S' }),
      ]);
      expect(html).toBe('A<br/>S: -2 – 4');
    });

    it('n\'affiche pas de ligne pour une plage absente', () => {
      const option: any = rangeConfigurator.buildOption(
        { categories: ['A'], series: [{ name: 'S', data: [[2, null]] }] } as any,
        'rangeColumn',
        config()
      );
      const html: string = option.tooltip.formatter([param(1, 0, { axisValueLabel: 'A' })]);
      expect(html).toBe('A');
    });

    it('conserve un formatter défini dans options.tooltip', () => {
      const option = optionOf([{ c: 'A', lo: 1, hi: 4 }]);
      const result: any = applyCommonConfig(option, { options: { tooltip: { formatter: 'custom' } } } as any);
      expect(result.tooltip.formatter).toBe('custom');
    });
  });
});
