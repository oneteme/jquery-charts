import { formatChartValue } from '@oneteme/jquery-core';
import { applyCommonConfig, formatTooltipValue } from './chart-utils';

describe('formatTooltipValue', () => {
  it('affiche un tiret pour null et undefined', () => {
    expect(formatTooltipValue(null)).toBe('–');
    expect(formatTooltipValue(undefined)).toBe('–');
  });

  it('affiche 0 pour zéro', () => {
    expect(formatTooltipValue(0)).toBe('0');
  });

  it('formate les nombres avec formatChartValue', () => {
    expect(formatTooltipValue(1234.5)).toBe(formatChartValue(1234.5));
    expect(formatTooltipValue(-7)).toBe(formatChartValue(-7));
  });

  it('accepte les nombres sous forme de chaîne', () => {
    expect(formatTooltipValue('12')).toBe(formatChartValue(12));
  });

  it('utilise la locale fr-FR par défaut (virgule décimale, espace de milliers)', () => {
    expect(formatTooltipValue(3.5)).toBe('3,5');
    expect(formatTooltipValue(1234.5)).toMatch(/^1\s235$/);
  });

  it('retourne le texte tel quel pour une valeur non numérique', () => {
    expect(formatTooltipValue('abc')).toBe('abc');
  });

  it('sérialise un objet', () => {
    expect(formatTooltipValue({ a: 1 })).toBe('{"a":1}');
  });

  it('affiche un tiret pour une chaîne vide ou blanche', () => {
    expect(formatTooltipValue('')).toBe('–');
    expect(formatTooltipValue('   ')).toBe('–');
  });
});

describe('applyCommonConfig', () => {
  const cfg = (extra: Record<string, unknown> = {}): any => ({ ...extra });

  it('n\'injecte pas de title sans titre ni sous-titre', () => {
    const result: any = applyCommonConfig({ series: [] } as any, cfg());
    expect(result.title).toBeUndefined();
  });

  it('injecte le title et le subtitle centrés', () => {
    const result: any = applyCommonConfig({} as any, cfg({ title: 'Ventes', subtitle: '2024' }));
    expect(result.title.text).toBe('Ventes');
    expect(result.title.subtext).toBe('2024');
    expect(result.title.left).toBe('center');
  });

  it('conserve un left explicite dans options.title', () => {
    const result: any = applyCommonConfig({} as any, cfg({
      title: 'T',
      options: { title: { left: 'left' } },
    }));
    expect(result.title.left).toBe('left');
  });

  it('applique xtitle sur xAxis.name', () => {
    const result: any = applyCommonConfig({} as any, cfg({ xtitle: 'Date' }));
    expect(result.xAxis).toEqual(jasmine.objectContaining({ name: 'Date', nameLocation: 'center', nameGap: 30 }));
  });

  it('applique ytitle sur yAxis.name', () => {
    const result: any = applyCommonConfig({} as any, cfg({ ytitle: 'Requêtes' }));
    expect(result.yAxis).toEqual(jasmine.objectContaining({ name: 'Requêtes', nameLocation: 'center', nameGap: 40 }));
  });

  it('utilise le premier titre lorsque ytitle est un tableau pour un axe Y unique', () => {
    const result: any = applyCommonConfig({ yAxis: { type: 'value' } } as any, cfg({ ytitle: ['A', 'B'] }));
    expect(result.yAxis).toEqual(jasmine.objectContaining({ name: 'A', nameLocation: 'center', nameGap: 40 }));
  });

  it('ne modifie pas un yAxis tableau (multi-axes) lorsque ytitle est un tableau', () => {
    const option = { yAxis: [{ type: 'value' }, { type: 'value' }] };
    const result: any = applyCommonConfig(option as any, cfg({ ytitle: ['A', 'B'] }));
    expect(Array.isArray(result.yAxis)).toBeTrue();
    expect(result.yAxis.length).toBe(2);
    expect(result.yAxis[0].name).toBeUndefined();
    expect(result.yAxis[1].name).toBeUndefined();
  });

  it('fusionne options en profondeur sans écraser les autres propriétés', () => {
    const option = { legend: { show: true, top: 10 }, tooltip: { trigger: 'axis' } };
    const result: any = applyCommonConfig(option as any, cfg({ options: { legend: { show: false } } }));
    expect(result.legend).toEqual(jasmine.objectContaining({ show: false, top: 10 }));
    expect(result.tooltip.trigger).toBe('axis');
  });

  it('ne modifie pas l\'option d\'entrée', () => {
    const option = { series: [{ name: 'a', type: 'line' }] };
    applyCommonConfig(option as any, cfg({ options: { series: [{ smooth: true }] } }));
    expect(option.series[0]).toEqual({ name: 'a', type: 'line' });
  });

  it('applique options.series index par index', () => {
    const option = { series: [{ name: 'a', type: 'line' }, { name: 'b', type: 'bar' }] };
    const result: any = applyCommonConfig(option as any, cfg({
      options: { series: [{ smooth: true }, { barWidth: 12 }] },
    }));
    expect(result.series[0]).toEqual(jasmine.objectContaining({ name: 'a', type: 'line', smooth: true }));
    expect(result.series[1]).toEqual(jasmine.objectContaining({ name: 'b', type: 'bar', barWidth: 12 }));
  });

  it('supprime le position center hérité quand label.show est activé sans position', () => {
    const option = { series: [{ name: 'a', label: { position: 'center' } }] };
    const result: any = applyCommonConfig(option as any, cfg({
      options: { series: [{ label: { show: true } }] },
    }));
    expect(result.series[0].label.show).toBe(true);
    expect(result.series[0].label.position).toBeUndefined();
  });

  it('conserve la position explicite de label', () => {
    const option = { series: [{ name: 'a', label: { position: 'center' } }] };
    const result: any = applyCommonConfig(option as any, cfg({
      options: { series: [{ label: { show: true, position: 'inside' } }] },
    }));
    expect(result.series[0].label.position).toBe('inside');
  });

  it('force tooltip.appendToBody à false', () => {
    const result: any = applyCommonConfig({ tooltip: { appendToBody: true } } as any, cfg());
    expect(result.tooltip.appendToBody).toBe(false);
  });

  it('traduit series.visible en legend.selected', () => {
    const option = { series: [{ name: 'a', visible: false }, { name: 'b', visible: true }] };
    const result: any = applyCommonConfig(option as any, cfg());
    expect(result.legend.selected).toEqual({ a: false, b: true });
  });

  it('applique le formatage d\'unité sur l\'axe Y quand yUnit est défini', () => {
    const option = { yAxis: { type: 'value' }, series: [{ name: 'a', type: 'line', data: [1] }] };
    const result: any = applyCommonConfig(option as any, cfg({ yUnit: 'ms' }));
    expect(typeof result.yAxis.axisLabel.formatter).toBe('function');
  });

  it('applique le formatage par défaut sur l\'axe Y sans yUnit', () => {
    const option = { yAxis: { type: 'value' }, series: [] };
    const result: any = applyCommonConfig(option as any, cfg());
    expect(typeof result.yAxis.axisLabel.formatter).toBe('function');
    expect(result.yAxis.axisLabel.formatter(1234.5)).toMatch(/^1\s235$/);
  });
});
