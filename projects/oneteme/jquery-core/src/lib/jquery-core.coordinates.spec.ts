import { buildChart, buildSingleSerieChart, field } from './jquery-core.model';

/** buildChart renvoie des unions génériques (YaxisType | Coordinate2D) : on lit les points en `any`. */
function pointsOf(chart: { series: { data: unknown[] }[] }): any[] {
  return chart.series.flatMap((s) => s.data as any[]);
}

describe('jquery-core coordonnees avec z (bulles)', () => {
  const rows = [
    { month: 'm1', revenue: 10, size: 3 },
    { month: 'm2', revenue: 20, size: 7 },
  ];

  describe('zField', () => {
    it('transporte z sur chaque point en mode continue', () => {
      const chart = buildChart(rows, {
        continue: true,
        series: [{ name: 'Bulles', data: { xField: 'month', yField: 'revenue', zField: 'size' } }],
      });

      expect(chart.series[0].data).toEqual([
        jasmine.objectContaining({ x: 'm1', y: 10, z: 3 }),
        jasmine.objectContaining({ x: 'm2', y: 20, z: 7 }),
      ]);
    });

    it('ne crée pas la clé z quand zField est absent', () => {
      const chart = buildChart(rows, {
        continue: true,
        series: [{ name: 'S', data: { xField: 'month', yField: 'revenue' } }],
      });

      pointsOf(chart).forEach((p) => expect('z' in p).toBe(false));
    });

    it('ne crée pas la clé z quand la valeur est undefined pour une ligne', () => {
      const data = [
        { month: 'm1', revenue: 1, size: 2 },
        { month: 'm2', revenue: 2, size: undefined },
      ];
      const chart = buildChart(data, {
        continue: true,
        series: [{ name: 'S', data: { xField: 'month', yField: 'revenue', zField: 'size' } }],
      });

      expect(pointsOf(chart)[0].z).toBe(2);
      expect('z' in pointsOf(chart)[1]).toBe(false);
    });

    it('rejette un zField vide ou non textuel', () => {
      expect(() =>
        buildChart(rows, {
          continue: true,
          series: [{ name: 'S', data: { xField: 'month', yField: 'revenue', zField: '  ' } as any }],
        })
      ).toThrowError(/zField doit etre une chaine non vide/);

      expect(() =>
        buildChart(rows, {
          continue: true,
          series: [{ name: 'S', data: { xField: 'month', yField: 'revenue', zField: 42 } as any }],
        })
      ).toThrowError(/zField doit etre une chaine non vide/);
    });

    it('accepte zField dans une configuration serialisee en JSON', () => {
      const provider = JSON.parse(
        JSON.stringify({
          continue: true,
          series: [{ name: 'S', data: { xField: 'month', yField: 'revenue', zField: 'size' } }],
        })
      );

      expect(pointsOf(buildChart(rows, provider))[1].z).toBe(7);
    });
  });

  describe('z en fonction', () => {
    it('applique la fonction z sur chaque ligne', () => {
      const chart = buildChart(rows, {
        continue: true,
        series: [
          {
            name: 'S',
            data: { x: field<any>('month'), y: field<any>('revenue'), z: (o: any) => o.size * 2 },
          },
        ],
      });

      expect(pointsOf(chart).map((p) => p.z)).toEqual([6, 14]);
    });

    it('rejette un z qui n est pas une fonction', () => {
      expect(() =>
        buildChart(rows, {
          continue: true,
          series: [{ name: 'S', data: { x: field<any>('month'), y: field<any>('revenue'), z: 3 as any } }],
        })
      ).toThrowError(/z doit etre une fonction/);
    });
  });

  describe('propagation de z', () => {
    it('conserve z lors de la fusion de plusieurs séries', () => {
      const chart = buildSingleSerieChart(rows, {
        continue: true,
        series: [
          { name: 'A', data: { xField: 'month', yField: 'revenue', zField: 'size' } },
          { name: 'B', data: { xField: 'month', yField: 'revenue', zField: 'size' } },
        ],
      });

      expect(pointsOf(chart).map((p) => p.z)).toEqual([3, 7, 3, 7]);
    });

    it('conserve z en mode pivot', () => {
      const data = [{ serie: 'A', month: 'm1', revenue: 10, size: 3 }];
      const chart = buildChart(data, {
        continue: true,
        pivot: true,
        series: [{ name: field('serie'), data: { xField: 'month', yField: 'revenue', zField: 'size' } }],
      });

      expect(pointsOf(chart)[0]).toEqual(jasmine.objectContaining({ x: 'A', z: 3 }));
    });
  });
});
