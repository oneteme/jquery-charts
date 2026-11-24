import { buildChartCode, highlightChartCode } from './chart-code-snippet.util';

describe('buildChartCode', () => {
  const rows = [{ name: 'Lundi', count: 3, start: 1, end: 4 }];

  it('remplace les accesseurs par field() quand le champ existe dans les données', () => {
    const code = buildChartCode('bar', {
      data: rows,
      config: { label: (row: { name: string }) => row.name },
    });

    expect(code).toContain("label: field('name')");
  });

  it('remplace un accesseur multiple par rangeFields()', () => {
    const code = buildChartCode('rangeBar', {
      data: rows,
      config: { range: (row: { start: number; end: number }) => [row.start, row.end] },
    });

    expect(code).toContain("range: rangeFields('start', 'end')");
  });

  it('résume une paire x/y d\'accesseurs en xField/yField', () => {
    const code = buildChartCode('scatter', {
      data: rows,
      config: {
        x: (row: { name: string }) => row.name,
        y: (row: { count: number }) => row.count,
      },
    });

    expect(code).toContain("const config = { xField: 'name', yField: 'count' };");
  });

  it('conserve le source d\'un accesseur dont le champ est absent des données', () => {
    const code = buildChartCode('bar', {
      data: rows,
      config: { label: (row: { missing: string }) => row.missing },
    });

    expect(code).toContain('missing');
    expect(code).not.toContain("field('missing')");
  });

  it('échappe les apostrophes des chaînes', () => {
    const code = buildChartCode('bar', { config: { title: "l'axe" } });

    expect(code).toContain("title: 'l\\'axe'");
  });

  it('insère le type de graphique dans le gabarit HTML', () => {
    const code = buildChartCode('donut', { data: rows, config: {} });

    expect(code).toContain('type="donut"');
    expect(code).toContain('const data = [');
  });

  it('produit un tableau vide lorsque les données sont absentes', () => {
    const code = buildChartCode('pie', {});

    expect(code).toContain('const data = [];');
  });
});

describe('highlightChartCode', () => {
  it('échappe le HTML avant de colorer le code', () => {
    expect(highlightChartCode('a < b & c')).toBe('a &lt; b &amp; c');
  });

  it('colore les mots-clés, les nombres et les commentaires', () => {
    expect(highlightChartCode('const a = 1;')).toBe(
      '<span class="keyword">const</span> a = <span class="number">1</span>;'
    );
    expect(highlightChartCode('// note')).toBe('<span class="comment">// note</span>');
  });

  it('colore les chaînes entre apostrophes et les fonctions utilitaires', () => {
    const highlighted = highlightChartCode("field('name')");

    expect(highlighted).toContain('<span class="fn">field</span>');
    expect(highlighted).toContain('<span class="string">\'name\'</span>');
  });

  it('colore la balise chart et ses attributs', () => {
    const highlighted = highlightChartCode('<chart\n  type="bar"\n></chart>');

    expect(highlighted).toContain('<span class="tag">&lt;chart</span>');
    expect(highlighted).toContain('<span class="tag">&lt;/chart&gt;</span>');
    expect(highlighted).toContain('<span class="attr">type</span>=');
  });
});
