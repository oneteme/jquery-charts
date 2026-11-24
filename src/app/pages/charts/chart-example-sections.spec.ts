import {
  APEXCHARTS_SECTIONS,
  ECHARTS_DETAIL_SECTIONS,
  ECHARTS_SECTIONS,
  HIGHCHARTS_SECTIONS,
  orderChartSections,
  supportsChartExample,
} from './chart-example-sections';

describe('chart-example-sections', () => {
  const catalogs = {
    ECHARTS_SECTIONS,
    HIGHCHARTS_SECTIONS,
    APEXCHARTS_SECTIONS,
  };

  it('ordonne les sections connues selon l\'ordre canonique et place les inconnues à la fin', () => {
    const ordered = orderChartSections([{ id: 'pie' }, { id: 'inconnu' }, { id: 'line' }]);

    expect(ordered.map(section => section.id)).toEqual(['line', 'pie', 'inconnu']);
  });

  it('ne modifie pas le tableau d\'origine', () => {
    const input = [{ id: 'pie' }, { id: 'line' }];

    orderChartSections(input);

    expect(input.map(section => section.id)).toEqual(['pie', 'line']);
  });

  it('ne contient aucun identifiant dupliqué dans un même catalogue', () => {
    for (const [name, sections] of Object.entries(catalogs)) {
      const ids = sections.map(section => section.id);
      expect(new Set(ids).size).withContext(name).toBe(ids.length);
    }
  });

  it('relie chaque section à la clé d\'exemple correspondant à son identifiant', () => {
    for (const [name, sections] of Object.entries(catalogs)) {
      for (const section of sections) {
        expect(section.exampleKey).withContext(`${name}/${section.id}`).toBe(`${section.id}Example`);
      }
    }
  });

  it('exclut du détail ECharts les sections qui n\'ont pas de page de détail', () => {
    const detailIds = ECHARTS_DETAIL_SECTIONS.map(section => section.id);

    expect(detailIds).toContain('bar');
    expect(detailIds).not.toContain('multiSeries');
    expect(detailIds.every(id => ECHARTS_SECTIONS.some(section => section.id === id))).toBeTrue();
  });

  it('indique si une librairie supporte un exemple, quel que soit le format du chemin', () => {
    expect(supportsChartExample('/charts/echarts', 'bar')).toBeTrue();
    expect(supportsChartExample('/charts/echarts/', 'bar')).toBeTrue();
    expect(supportsChartExample('echarts', 'bar')).toBeTrue();
    expect(supportsChartExample('/charts/highcharts', 'gauge')).toBeFalse();
    expect(supportsChartExample('/charts/unknown', 'bar')).toBeFalse();
  });
});
