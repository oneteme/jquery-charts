import * as echarts from 'echarts';
import { mixedConfigurator } from './mixed-config';

const rows = [
  { s: 'Ventes', c: 'Jan', v: 10, t: 'bar' },
  { s: 'Ventes', c: 'Fév', v: 20, t: 'bar' },
  { s: 'Marge', c: 'Jan', v: 30, t: 'line' },
  { s: 'Marge', c: 'Fév', v: 40, t: 'line' },
];

const seriesConfig = (extra: Record<string, unknown> = {}, ytitle?: any): any => ({
  ...(ytitle !== undefined ? { ytitle } : {}),
  series: [
    {
      name: (o: any) => o.s,
      type: (o: any) => o.t,
      data: { xField: 'c', yField: 'v' },
      ...extra,
    },
  ],
});

function build(data: any[], config: any, type: any = 'mixed'): any {
  const model = mixedConfigurator.buildChartData(data, config, type);
  return mixedConfigurator.buildOption(model, type, config);
}

describe('mixedConfigurator', () => {
  it('ne supporte que le type mixed et déclenche le tooltip sur l\'axe', () => {
    expect(mixedConfigurator.supports('mixed')).toBeTrue();
    expect(mixedConfigurator.supports('bar')).toBeFalse();
    expect(mixedConfigurator.tooltipTrigger).toBe('axis');
  });

  describe('types de séries', () => {
    it('rend bar, column et columnpyramid en barres empilables', () => {
      ['bar', 'column', 'columnpyramid'].forEach((t) => {
        const option = build(
          [{ s: 'S', c: 'A', v: 1, t }],
          seriesConfig({ stack: 'total' })
        );
        expect(option.series[0].type).toBe('bar');
        expect(option.series[0].stack).toBe('total');
        expect(option.series[0].barMaxWidth).toBe('60%');
      });
    });

    it('rend line sans zone ni lissage', () => {
      const option = build([{ s: 'S', c: 'A', v: 1, t: 'line' }], seriesConfig());
      expect(option.series[0].type).toBe('line');
      expect(option.series[0].smooth).toBeFalse();
      expect(option.series[0].areaStyle).toBeUndefined();
    });

    it('rend area avec zone sans lissage', () => {
      const option = build([{ s: 'S', c: 'A', v: 1, t: 'area' }], seriesConfig());
      expect(option.series[0].areaStyle).toEqual({});
      expect(option.series[0].smooth).toBeFalse();
    });

    it('rend spline lissée et areaspline lissée avec zone', () => {
      const spline = build([{ s: 'S', c: 'A', v: 1, t: 'spline' }], seriesConfig());
      expect(spline.series[0].smooth).toBeTrue();
      expect(spline.series[0].areaStyle).toBeUndefined();

      const areaspline = build([{ s: 'S', c: 'A', v: 1, t: 'areaspline' }], seriesConfig());
      expect(areaspline.series[0].smooth).toBeTrue();
      expect(areaspline.series[0].areaStyle).toEqual({});
    });

    it('rend une série sans type explicite en line', () => {
      const option = build([{ s: 'S', c: 'A', v: 1 }], seriesConfig());
      expect(option.series[0].type).toBe('line');
    });

    it('superpose les lignes au-dessus des zones (z plus élevé)', () => {
      const area = build([{ s: 'S', c: 'A', v: 1, t: 'area' }], seriesConfig()).series[0];
      const line = build([{ s: 'S', c: 'A', v: 1, t: 'line' }], seriesConfig()).series[0];
      expect(area.z).toBe(1);
      expect(line.z).toBe(2);
    });

    it('applique la couleur de la série à la barre et à la ligne', () => {
      const bar = build([rows[0]], seriesConfig({ color: '#ff0000' })).series[0];
      const line = build([rows[2]], seriesConfig({ color: '#00ff00' })).series[0];
      expect(bar.itemStyle).toEqual({ color: '#ff0000' });
      expect(line.lineStyle).toEqual({ color: '#00ff00' });
    });
  });

  describe('axe des abscisses', () => {
    it('active boundaryGap dès qu\'une série est une barre', () => {
      expect(build(rows, seriesConfig()).xAxis.boundaryGap).toBeTrue();
    });

    it('désactive boundaryGap avec uniquement des lignes', () => {
      const lines = rows.filter((r) => r.t === 'line');
      expect(build(lines, seriesConfig()).xAxis.boundaryGap).toBeFalse();
    });

    it('transmet les catégories en chaînes', () => {
      expect(build(rows, seriesConfig()).xAxis.data).toEqual(['Jan', 'Fév']);
    });

    it('mode continu : pas de catégories, données en paires [x, y]', () => {
      const config = {
        continue: true,
        series: [{ name: 'A', type: 'line', data: { xField: 'x', yField: 'v' } }],
      };
      const option = build(
        [
          { x: 1, v: 5 },
          { x: 2, v: 7 },
        ],
        config
      );
      expect(option.xAxis.data).toBeUndefined();
      expect(option.series[0].data).toEqual([
        [1, 5],
        [2, 7],
      ]);
    });
  });

  describe('axes Y', () => {
    it('un seul axe : yAxis est un objet unique, toutes les séries sur l\'axe 0', () => {
      const option = build(rows, seriesConfig({}, 'Chiffre'));
      expect(Array.isArray(option.yAxis)).toBeFalse();
      expect(option.yAxis.name).toBe('Chiffre');
      expect(option.yAxis.position).toBe('left');
      expect(option.series.map((s: any) => s.yAxisIndex)).toEqual([0, 0]);
    });

    it('deux axes : une série par axe, avec positions gauche/droite et titres', () => {
      const option = build([rows[0], rows[2]], seriesConfig({}, ['Chiffre', 'Taux']));
      expect(Array.isArray(option.yAxis)).toBeTrue();
      expect(option.yAxis.length).toBe(2);
      expect(option.yAxis.map((a: any) => a.name)).toEqual(['Chiffre', 'Taux']);
      expect(option.yAxis.map((a: any) => a.position)).toEqual(['left', 'right']);
      expect(option.series.map((s: any) => s.yAxisIndex)).toEqual([0, 1]);
    });

    it('affecte automatiquement les barres à l\'axe 0 et les lignes à l\'axe 1', () => {
      const threeSeries = [
        { s: 'A', c: 'Jan', v: 1, t: 'bar' },
        { s: 'B', c: 'Jan', v: 2, t: 'bar' },
        { s: 'C', c: 'Jan', v: 3, t: 'line' },
      ];
      const option = build(threeSeries, seriesConfig({}, ['Montant', 'Pourcentage']));
      expect(option.series.map((s: any) => s.yAxisIndex)).toEqual([0, 0, 1]);
    });

    it('respecte un yAxisIndex explicite sur la série', () => {
      const option = build([rows[2]], seriesConfig({ yAxisIndex: 1 }, ['A', 'B']));
      expect(option.series[0].yAxisIndex).toBe(1);
      expect(option.yAxis.length).toBe(2);
    });

    it('rejette un yAxisIndex hors de 0..1', () => {
      expect(() => build([rows[0]], seriesConfig({ yAxisIndex: 2 }))).toThrowError(/accepte au maximum 2 axes Y/);
      expect(() => build([rows[0]], seriesConfig({ yAxisIndex: -1 }))).toThrowError(/accepte au maximum 2 axes Y/);
      expect(() => build([rows[0]], seriesConfig({ yAxisIndex: 1.5 }))).toThrowError(/accepte au maximum 2 axes Y/);
    });

    it('avertit et plafonne à 2 axes quand plus de 2 titres sont fournis', () => {
      const warn = spyOn(console, 'warn');
      const option = build(rows, seriesConfig({}, ['A', 'B', 'C']));
      expect(warn).toHaveBeenCalledWith(jasmine.stringMatching('accepte au maximum 2 axes Y'));
      expect(Array.isArray(option.yAxis)).toBeTrue();
      expect(option.yAxis.length).toBe(2);
    });

    it('avertit en cas de multi-axes ambigus et rattache tout à l\'axe 0', () => {
      const warn = spyOn(console, 'warn');
      const lines = [
        { s: 'A', c: 'Jan', v: 1, t: 'line' },
        { s: 'B', c: 'Jan', v: 2, t: 'line' },
        { s: 'C', c: 'Jan', v: 3, t: 'line' },
      ];
      const option = build(lines, seriesConfig({}, ['X', 'Y']));
      expect(warn).toHaveBeenCalledWith(jasmine.stringMatching('ambiguë'));
      expect(option.series.map((s: any) => s.yAxisIndex)).toEqual([0, 0, 0]);
    });

    it('aligne les graduations par défaut quand il y a deux axes', () => {
      const option = build([rows[0], rows[2]], {
        ytitle: ['A', 'B'],
        series: [
          { name: (o: any) => o.s, type: (o: any) => o.t, data: { xField: 'c', yField: 'v' } },
        ],
      });
      expect(option.yAxis.map((a: any) => a.alignTicks)).toEqual([true, true]);
    });

    it('désactive l\'alignement des graduations si une série le demande explicitement', () => {
      const chart: any = {
        categories: ['Jan'],
        series: [
          { name: 'A', type: 'line', data: [1], yAxisIndex: 0, yAxisConfig: { alignTicks: false } },
          { name: 'B', type: 'line', data: [2], yAxisIndex: 1 },
        ],
      };
      const option: any = mixedConfigurator.buildOption(chart, 'mixed', { ytitle: ['A', 'B'] } as any);
      expect(option.yAxis.map((a: any) => a.alignTicks)).toEqual([false, false]);
    });

    it('avertit quand deux séries d\'un même axe demandent des splitNumber différents, et retient le dernier', () => {
      const warn = spyOn(console, 'warn');
      const chart: any = {
        categories: ['Jan'],
        series: [
          { name: 'A', type: 'line', data: [1], yAxisConfig: { splitNumber: 4 } },
          { name: 'B', type: 'line', data: [2], yAxisConfig: { splitNumber: 6 } },
        ],
      };
      const option: any = mixedConfigurator.buildOption(chart, 'mixed', { ytitle: 'Chiffre' } as any);
      expect(warn).toHaveBeenCalledWith(jasmine.stringMatching('splitNumber'));
      expect(option.yAxis.splitNumber).toBe(6);
    });

  });

  describe('unités et tooltip', () => {
    const formatterParams = (seriesIndex: number, seriesName: string, value: number): any[] => [
      { seriesIndex, seriesName, axisValueLabel: 'Jan', value, marker: '' },
    ];

    it('extrait l\'unité entre parenthèses du titre de l\'axe et l\'affiche dans le tooltip', () => {
      const option = build(rows, {
        ytitle: ['Chiffre (€)', 'Taux (%)'],
        series: [
          { name: (o: any) => o.s, type: (o: any) => o.t, data: { xField: 'c', yField: 'v' } },
        ],
      });
      const formatter = option.tooltip.formatter;
      expect(formatter(formatterParams(0, 'Ventes', 10))).toContain('Ventes: 10 €');
      expect(formatter(formatterParams(1, 'Marge', 30))).toContain('Marge: 30 %');
    });

    it('privilégie l\'unité propre à la série sur celle du titre d\'axe', () => {
      const option = build([rows[2]], seriesConfig({ unit: 'pts' }, 'Taux (%)'));
      expect(option.tooltip.formatter(formatterParams(0, 'Marge', 30))).toContain('Marge: 30 pts');
    });

    it('n\'ajoute aucun formateur de tooltip sans unité', () => {
      const option = build(rows, seriesConfig({}, 'Chiffre'));
      expect(option.tooltip).toBeUndefined();
    });
  });

  describe('légende', () => {
    it('masque par défaut les séries visible: false', () => {
      const option = build(
        rows,
        seriesConfig({ visible: (o: any) => o.s !== 'Marge' })
      );
      expect(option.legend).toEqual({ selected: { Marge: false } });
    });

    it('n\'émet pas de légende explicite quand toutes les séries sont visibles', () => {
      expect(build(rows, seriesConfig()).legend).toBeUndefined();
    });
  });

  it('produit une option acceptée par ECharts (barres et lignes sur deux axes)', () => {
    const option = build(rows, {
      ytitle: ['Chiffre (€)', 'Taux (%)'],
      series: [
        { name: (o: any) => o.s, type: (o: any) => o.t, data: { xField: 'c', yField: 'v' } },
      ],
    });

    const host = document.createElement('div');
    host.style.width = '640px';
    host.style.height = '420px';
    document.body.appendChild(host);
    const instance = echarts.init(host, undefined, { renderer: 'canvas' });
    try {
      instance.setOption(option as any, { notMerge: true });
      const rendered = instance.getOption() as any;
      expect(rendered.yAxis.length).toBe(2);
      expect(rendered.series.map((s: any) => s.type)).toEqual(['bar', 'line']);
    } finally {
      instance.dispose();
      host.remove();
    }
  });
});
