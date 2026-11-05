import { buildPeriodOptions, comparePeriodLabels, convertPeriodSelection, formatChartDate, formatPeriodLabel, PERIOD_AUTO_OPTION_ID, remapSliceKeys, sortPeriodLabels } from './chart-data-date';

describe('formatChartDate', () => {
  it('uses fr-FR by default', () => {
    expect(formatChartDate('2026-11-03T00:00:00Z')).toBe('03/11/2026');
  });

  it('honours an explicit locale', () => {
    expect(formatChartDate('2026-11-03T00:00:00Z', { locale: 'en-US' })).toBe('11/03/2026');
  });

  it('returns null for nullish values', () => {
    expect(formatChartDate(null)).toBeNull();
    expect(formatChartDate(undefined)).toBeNull();
  });
});

describe('buildPeriodOptions', () => {
  it('propose Automatique en premier puis les découpages avec des libellés français', () => {
    const options = buildPeriodOptions();
    expect(options[0]).toEqual({ id: PERIOD_AUTO_OPTION_ID, label: 'Automatique' });
    expect(options.map(o => o.id)).toEqual(['auto', 'monthDayHour', 'date', 'yearWeek', 'yearMonth', 'year']);
    expect(options.map(o => o.label)).toEqual(['Automatique', 'Heure', 'Jour', 'Semaine', 'Mois', 'Année']);
  });
});

describe('formatPeriodLabel', () => {
  it('formats hour buckets as HH:mm', () => {
    expect(formatPeriodLabel('13', 'hour')).toBe('13:00');
    expect(formatPeriodLabel('9', 'hour')).toBe('09:00');
    expect(formatPeriodLabel(0, 'hour')).toBe('00:00');
  });

  it('formats monthDay buckets as a French day and short month', () => {
    expect(formatPeriodLabel('11-03', 'monthDay')).toBe('3 nov.');
    expect(formatPeriodLabel('12-25', 'monthDay')).toBe('25 déc.');
  });

  it('formats monthDayHour buckets as a French day, short month and hour', () => {
    expect(formatPeriodLabel('11-03 14', 'monthDayHour')).toBe('3 nov. 14:00');
    expect(formatPeriodLabel('11-03 9', 'monthDayHour')).toBe('3 nov. 09:00');
  });

  it('formats date buckets as a French day, short month and year', () => {
    expect(formatPeriodLabel('2026-11-03', 'date')).toBe('3 nov. 2026');
    expect(formatPeriodLabel('2026-12-25', 'date')).toBe('25 déc. 2026');
  });

  it('formats yearWeek buckets as S<week> <year>', () => {
    expect(formatPeriodLabel('2026-W30', 'yearWeek')).toBe('S30 2026');
    expect(formatPeriodLabel('2026-W02', 'yearWeek')).toBe('S02 2026');
  });

  it('formats yearMonth buckets as a French short month and year', () => {
    expect(formatPeriodLabel('2026-11', 'yearMonth')).toBe('nov. 2026');
  });

  it('returns year buckets unchanged', () => {
    expect(formatPeriodLabel('2026', 'year')).toBe('2026');
  });

  it('honours an explicit locale', () => {
    expect(formatPeriodLabel('11-03', 'monthDay', { locale: 'en-US' })).toBe('Nov 3');
  });

  it('returns unparseable or out-of-range values unchanged', () => {
    expect(formatPeriodLabel('abc', 'hour')).toBe('abc');
    expect(formatPeriodLabel('24', 'hour')).toBe('24');
    expect(formatPeriodLabel('11-03 24', 'monthDayHour')).toBe('11-03 24');
    expect(formatPeriodLabel('11-03', 'monthDayHour')).toBe('11-03');
    expect(formatPeriodLabel('13-45', 'monthDay')).toBe('13-45');
    expect(formatPeriodLabel('2026-13', 'yearMonth')).toBe('2026-13');
    expect(formatPeriodLabel('2026-02-30-x', 'date')).toBe('2026-02-30-x');
    expect(formatPeriodLabel('2026-13-01', 'date')).toBe('2026-13-01');
  });
});

describe('sortPeriodLabels', () => {
  it('sorts date buckets chronologically across months and years', () => {
    expect(sortPeriodLabels(['2026-11-10', '2026-11-09', '2027-01-01'], 'date')).toEqual(['2026-11-09', '2026-11-10', '2027-01-01']);
  });

  it('sorts hours numerically instead of lexicographically', () => {
    expect(sortPeriodLabels(['17', '9', '10'], 'hour')).toEqual(['9', '10', '17']);
  });

  it('sorts yearWeek and yearMonth chronologically across years', () => {
    expect(sortPeriodLabels(['2027-W01', '2026-W52'], 'yearWeek')).toEqual(['2026-W52', '2027-W01']);
    expect(sortPeriodLabels(['2027-01', '2026-11'], 'yearMonth')).toEqual(['2026-11', '2027-01']);
  });

  it('keeps monthDay buckets in order when a range crosses New Year', () => {
    const from = new Date(Date.UTC(2026, 10, 28));
    expect(sortPeriodLabels(['01-02', '11-30', '12-01'], 'monthDay', from)).toEqual(['11-30', '12-01', '01-02']);
  });

  it('sorts monthDayHour buckets by day then hour, across New Year', () => {
    const from = new Date(Date.UTC(2026, 10, 3));
    expect(sortPeriodLabels(['01-01 0', '11-04 9', '11-03 17', '11-04 10', '11-03 9'], 'monthDayHour', from))
      .toEqual(['11-03 9', '11-03 17', '11-04 9', '11-04 10', '01-01 0']);
  });

  it('sorts monthDayHour buckets without an anchor by month, day then hour', () => {
    expect(sortPeriodLabels(['11-04 9', '11-03 17', '11-03 9'], 'monthDayHour')).toEqual(['11-03 9', '11-03 17', '11-04 9']);
  });

  it('places unparseable values last without dropping them', () => {
    expect(sortPeriodLabels(['x', '2', '1'], 'hour')).toEqual(['1', '2', 'x']);
  });

  it('does not mutate the input array', () => {
    const input = ['3', '1'];
    sortPeriodLabels(input, 'hour');
    expect(input).toEqual(['3', '1']);
  });
});

describe('comparePeriodLabels', () => {
  it('works as a sort callback with the same ordering as sortPeriodLabels', () => {
    const from = new Date(Date.UTC(2026, 10, 28));
    const values = ['01-02', '11-30', '12-01'];
    expect([...values].sort((a, b) => comparePeriodLabels(a, b, 'monthDay', from))).toEqual(sortPeriodLabels(values, 'monthDay', from));
  });

  it('returns 0 for equal and unparseable values', () => {
    expect(comparePeriodLabels('x', 'y', 'hour')).toBe(0);
    expect(comparePeriodLabels('9', '9', 'hour')).toBe(0);
  });

  it('returns a negative value when the left label comes first', () => {
    expect(comparePeriodLabels('9', '17', 'hour')).toBeLessThan(0);
    expect(comparePeriodLabels('17', '9', 'hour')).toBeGreaterThan(0);
  });
});

describe('convertPeriodSelection', () => {
  const days = ['2026-11-03', '2026-11-04'];
  const hoursOfDays = [
    '11-03 0', '11-03 1', '11-03 2',
    '11-04 0', '11-04 1', '11-04 2',
  ];

  it('returns an empty array for an empty selection', () => {
    expect(convertPeriodSelection([], days, hoursOfDays)).toEqual([]);
  });

  it('returns null when the target list is empty', () => {
    expect(convertPeriodSelection(['2026-11-03'], days, [])).toBeNull();
  });

  it('converts selected days into all their hours (day → hour)', () => {
    expect(convertPeriodSelection(['2026-11-03'], days, hoursOfDays)).toEqual(['11-03 0', '11-03 1', '11-03 2']);
  });

  it('converts several selected days into the hours of each day', () => {
    expect(convertPeriodSelection(['2026-11-03', '2026-11-04'], days, hoursOfDays)).toEqual(hoursOfDays);
  });

  it('returns null when no target hour matches the selected days (day → hour)', () => {
    expect(convertPeriodSelection(['2026-12-01'], days, hoursOfDays)).toBeNull();
  });

  it('converts all hours of a day back into the day (hour → day)', () => {
    const sourceHours = ['11-03 0', '11-03 1', '11-03 2'];
    expect(convertPeriodSelection(sourceHours, sourceHours, ['2026-11-03'])).toEqual(['2026-11-03']);
  });

  it('closes on a partial day selection (hour → day)', () => {
    const sourceHours = ['11-03 0', '11-03 1', '11-03 2'];
    expect(convertPeriodSelection(['11-03 0', '11-03 1'], sourceHours, ['2026-11-03'])).toBeNull();
  });

  it('closes when one of several selected days is partial (hour → day)', () => {
    const selected = ['11-03 0', '11-03 1', '11-04 0'];
    const sourceHours = ['11-03 0', '11-03 1', '11-04 0', '11-04 1'];
    expect(convertPeriodSelection(selected, sourceHours, ['2026-11-03', '2026-11-04'])).toBeNull();
    expect(convertPeriodSelection(['11-03 0', '11-03 1'], sourceHours, ['2026-11-03', '2026-11-04'])).toEqual(['2026-11-03']);
  });

  it('returns null when a day matches several years (hour → day)', () => {
    const sourceHours = ['11-03 0'];
    expect(convertPeriodSelection(sourceHours, sourceHours, ['2025-11-03', '2026-11-03'])).toBeNull();
  });

  it('returns null for granularities without an exact conversion', () => {
    expect(convertPeriodSelection(['2026-W30'], ['2026-W30', '2026-W31'], ['2026-11-03'])).toBeNull();
    expect(convertPeriodSelection(['2026-11'], ['2026-10', '2026-11'], ['2026-11-03'])).toBeNull();
    expect(convertPeriodSelection(['2026'], ['2025', '2026'], ['2026-11-03'])).toBeNull();
    expect(convertPeriodSelection(['13'], ['13', '14'], ['11-03 13'])).toBeNull();
  });

  describe('single-day plain hours', () => {
    const plainHours = Array.from({ length: 24 }, (_, hour) => String(hour));

    it('converts the selected day into every plain hour of the single-day window (day → hour)', () => {
      expect(convertPeriodSelection(['2026-11-03'], ['2026-11-03'], plainHours)).toEqual(plainHours);
    });

    it('keeps only the hours present in the target list (day → hour)', () => {
      expect(convertPeriodSelection(['2026-11-03'], ['2026-11-03'], ['13', '14', '15'])).toEqual(['13', '14', '15']);
    });

    it('returns null when the selected day is not the single day of the window (day → hour)', () => {
      expect(convertPeriodSelection(['2026-11-04'], ['2026-11-03'], plainHours)).toBeNull();
    });

    it('returns null when the window covers several days (day → hour)', () => {
      expect(convertPeriodSelection(['2026-11-03'], days, plainHours)).toBeNull();
    });

    it('converts all displayed plain hours back into the single day (hour → day)', () => {
      expect(convertPeriodSelection(plainHours, plainHours, ['2026-11-03'])).toEqual(['2026-11-03']);
    });

    it('accepts a single-day window where only some hours were recorded (hour → day)', () => {
      expect(convertPeriodSelection(['12', '13'], ['12', '13'], ['2026-11-03'])).toEqual(['2026-11-03']);
    });

    it('closes on a partial plain hour selection (hour → day)', () => {
      expect(convertPeriodSelection(['12'], ['12', '13'], ['2026-11-03'])).toBeNull();
    });

    it('closes when a selected hour is not one of the displayed hours (hour → day)', () => {
      expect(convertPeriodSelection(['12', '99'], ['12'], ['2026-11-03'])).toBeNull();
    });

    it('closes when the target list covers several days (hour → day)', () => {
      expect(convertPeriodSelection(['12'], ['12'], ['2026-11-03', '2026-11-04'])).toBeNull();
    });

    it('returns null for plain hours without a displayed source list (hour → day)', () => {
      expect(convertPeriodSelection(['12'], [], ['2026-11-03'])).toBeNull();
    });

    it('keeps multi-day plain hours closed (merged buckets have no date)', () => {
      expect(convertPeriodSelection(['13'], ['13', '14'], ['2026-11-03', '2026-11-04'])).toBeNull();
    });
  });

  describe('remapSliceKeys with single-day plain hours', () => {
    it('remaps a day selection onto the plain hours of a single-day window', () => {
      expect(remapSliceKeys(['2026-11-03'], ['2026-11-03'], ['0', '1', '2'])).toEqual(['0', '1', '2']);
    });

    it('remaps all plain hours of a single-day window onto the day', () => {
      expect(remapSliceKeys(['0', '1', '2'], ['0', '1', '2'], ['2026-11-03'])).toEqual(['2026-11-03']);
    });
  });
});

describe('remapSliceKeys', () => {
  it('converts period keys with convertPeriodSelection', () => {
    expect(remapSliceKeys(['2026-11-03'], ['2026-11-03', '2026-11-04'], ['11-03 0', '11-03 1'])).toEqual(['11-03 0', '11-03 1']);
  });

  it('returns null when a period selection cannot be converted', () => {
    expect(remapSliceKeys(['11-03 0'], ['11-03 0', '11-03 1'], ['2026-11-03'])).toBeNull();
  });

  it('keeps non-period keys when they all exist in the new list', () => {
    expect(remapSliceKeys(['EP_A', 'EP_B'], ['EP_A', 'EP_B', 'EP_C'], ['EP_A', 'EP_B'])).toEqual(['EP_A', 'EP_B']);
  });

  it('returns null when a non-period key is missing from the new list', () => {
    expect(remapSliceKeys(['EP_A', 'EP_D'], ['EP_A', 'EP_D'], ['EP_A', 'EP_B'])).toBeNull();
  });

  it('returns a copy and not the same array', () => {
    const selected = ['EP_A'];
    const result = remapSliceKeys(selected, ['EP_A'], ['EP_A']);
    expect(result).toEqual(['EP_A']);
    expect(result).not.toBe(selected);
  });
});

