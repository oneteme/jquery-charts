import { createUnitConverter, defineLinearUnit } from './chart-data-unit';
import { convertChartDataValues, formatChartDataDates, formatChartDataValues, mapChartDataFields } from './chart-data-transform';
import { formatChartDate } from './chart-data-date';
import { formatChartNumber } from './chart-data-number';

interface Row {
  id: number;
  label: string;
  when: string | null;
  amount: number | null;
}

describe('chart-data-transform', () => {
  const rows: Row[] = [
    { id: 1, label: 'a', when: '2026-11-03T10:00:00Z', amount: 1500 },
    { id: 2, label: 'b', when: null, amount: null },
  ];

  describe('mapChartDataFields', () => {
    it('transforms only the listed fields and keeps the others', () => {
      const result = mapChartDataFields(rows, ['amount'], value => (value ?? 0) * 2);
      expect(result[0]).toEqual({ id: 1, label: 'a', when: '2026-11-03T10:00:00Z', amount: 3000 });
      expect(result[1].amount).toBe(0);
    });

    it('passes value, field, row and index to the transform', () => {
      const calls: unknown[][] = [];
      mapChartDataFields(rows, ['label'], (value, field, row, index) => {
        calls.push([value, field, row.id, index]);
        return value;
      });
      expect(calls).toEqual([['a', 'label', 1, 0], ['b', 'label', 2, 1]]);
    });

    it('never mutates the input rows', () => {
      const snapshot = JSON.parse(JSON.stringify(rows));
      mapChartDataFields(rows, ['label'], () => 'changed');
      expect(rows).toEqual(snapshot);
    });

    it('returns an empty array for empty input', () => {
      expect(mapChartDataFields([] as Row[], ['label'], value => value)).toEqual([]);
    });

    it('rejects a field listed more than once', () => {
      expect(() => mapChartDataFields(rows, ['label', 'label'], value => value)).toThrowError(TypeError);
    });
  });

  describe('formatChartDataDates', () => {
    it('formats dates with formatChartDate and preserves nullish values', () => {
      const options = { locale: 'fr-FR', timeZone: 'UTC' };
      const result = formatChartDataDates(rows, ['when'], options);
      expect(result[0].when).toBe(formatChartDate(rows[0].when, options));
      expect(result[1].when).toBeNull();
      expect(result[0].amount).toBe(1500);
    });
  });

  describe('formatChartDataValues', () => {
    it('formats numbers with formatChartNumber and preserves nullish values', () => {
      const result = formatChartDataValues(rows, ['amount'], { locale: 'fr-FR' });
      expect(result[0].amount).toBe(formatChartNumber(1500, { locale: 'fr-FR' }));
      expect(result[1].amount).toBeNull();
    });
  });

  describe('convertChartDataValues', () => {
    const converter = createUnitConverter([
      defineLinearUnit('ms', { factor: 1 }),
      defineLinearUnit('s', { factor: 1000 }),
    ]);

    it('converts finite values and preserves nullish values', () => {
      const result = convertChartDataValues(rows, ['amount'], converter, 'ms', 's');
      expect(result[0].amount).toBeCloseTo(1.5, 10);
      expect(result[1].amount).toBeNull();
    });

    it('rejects non-numeric values', () => {
      const dirty = [{ id: 3, label: 'c', when: null, amount: '12' as unknown as number }];
      expect(() => convertChartDataValues(dirty, ['amount'], converter, 'ms', 's')).toThrowError(TypeError);
    });

    it('rejects non-finite values', () => {
      const dirty = [{ id: 4, label: 'd', when: null, amount: NaN }];
      expect(() => convertChartDataValues(dirty, ['amount'], converter, 'ms', 's')).toThrowError(TypeError);
    });
  });
});
