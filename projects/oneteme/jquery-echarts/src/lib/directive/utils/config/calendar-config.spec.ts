import { buildCalendarModel, calendarConfigurator, toDayKey } from './calendar-config';
import { formatTooltipValue } from '../chart-utils';

describe('toDayKey', () => {
  it('garde une chaîne YYYY-MM-DD telle quelle', () => {
    expect(toDayKey('2024-03-10')).toBe('2024-03-10');
  });

  it('convertit une Date en jour local, sans décalage horaire', () => {
    expect(toDayKey(new Date(2024, 0, 5, 23, 30))).toBe('2024-01-05');
    expect(toDayKey(new Date(2024, 0, 5, 0, 5).getTime())).toBe('2024-01-05');
  });

  it('retourne undefined pour les valeurs vides ou invalides', () => {
    expect(toDayKey(null)).toBeUndefined();
    expect(toDayKey('')).toBeUndefined();
    expect(toDayKey('pas une date')).toBeUndefined();
  });
});

describe('buildCalendarModel', () => {
  const config: any = { series: [{ name: 'S', data: { xField: 'd', yField: 'v' } }] };

  it('additionne les valeurs par jour et trie les jours', () => {
    const data = [
      { d: '2024-01-06', v: 1 },
      { d: '2024-01-05', v: 2 },
      { d: '2024-01-05', v: 3 },
    ];
    expect(buildCalendarModel(data, config).days).toEqual([
      ['2024-01-05', 5],
      ['2024-01-06', 1],
    ]);
  });

  it('ignore les dates invalides et les valeurs non numériques', () => {
    const dirty: any[] = [
      { d: 'bad', v: 4 },
      { d: '2024-01-07', v: null },
      { d: '2024-01-08', v: 2 },
    ];
    expect(buildCalendarModel(dirty, config).days).toEqual([['2024-01-08', 2]]);
  });
});

describe('calendarConfigurator', () => {
  const config: any = { series: [{ name: 'S', data: { xField: 'd', yField: 'v' } }] };

  it('supporte uniquement calendar', () => {
    expect(calendarConfigurator.supports('calendar')).toBeTrue();
    expect(calendarConfigurator.supports('heatmap')).toBeFalse();
  });

  it('produit une heatmap calendaire couvrant la plage des données', () => {
    const data = [{ d: '2024-01-05', v: 2 }, { d: '2024-02-01', v: 7 }];
    const model = calendarConfigurator.buildChartData(data, config, 'calendar');
    const option: any = calendarConfigurator.buildOption(model, 'calendar', config);
    expect(option.calendar.range).toEqual(['2024-01-05', '2024-02-01']);
    expect(option.series[0].type).toBe('heatmap');
    expect(option.series[0].coordinateSystem).toBe('calendar');
    expect(option.series[0].data).toEqual([['2024-01-05', 2], ['2024-02-01', 7]]);
    expect(option.visualMap.min).toBe(2);
    expect(option.visualMap.max).toBe(7);
    expect(option.legend.show).toBeFalse();
  });

  it('affiche l\'année courante quand il n\'y a pas de donnée', () => {
    const model = calendarConfigurator.buildChartData([], config, 'calendar');
    const option: any = calendarConfigurator.buildOption(model, 'calendar', config);
    expect(option.calendar.range).toBe(String(new Date().getFullYear()));
    expect(option.visualMap.max).toBeGreaterThan(option.visualMap.min);
  });

  it('utilise des libellés français pour les mois, les jours et la légende', () => {
    const model = calendarConfigurator.buildChartData([{ d: '2024-01-05', v: 2 }], config, 'calendar');
    const option: any = calendarConfigurator.buildOption(model, 'calendar', config);
    expect(option.calendar.monthLabel.nameMap[0]).toBe('janv.');
    expect(option.calendar.monthLabel.nameMap[11]).toBe('déc.');
    expect(option.calendar.dayLabel.nameMap[1]).toBe('lun.');
    expect(option.calendar.yearLabel.position).toBe('top');
    expect(option.calendar.cellSize).toEqual(['auto', 14]);
    expect(option.calendar.left).toBe(40);
    expect(option.calendar.right).toBe(40);
    expect(option.visualMap.text).toEqual(['Élevé', 'Faible']);
  });

  it('formate l\'infobulle en date française et valeur formatée', () => {
    const model = calendarConfigurator.buildChartData([{ d: '2024-01-16', v: 1234 }], config, 'calendar');
    const option: any = calendarConfigurator.buildOption(model, 'calendar', config);
    const text: string = option.series[0].tooltip.formatter({ value: ['2024-01-16', 1234] });
    expect(text).toContain('mardi 16 janvier 2024');
    expect(text).toContain(formatTooltipValue(1234));
  });
});
