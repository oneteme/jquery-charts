import { sanitizeSvgMarkup } from './svg-sanitizer';

const TABLER_PROGRESS_CHECK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path stroke="none" d="M0 0h24v24H0z" fill="none"/>' +
  '<path d="M12 3a9 9 0 1 0 9 9"/>' +
  '<path d="M9 12l2 2l4 -4"/>' +
  '</svg>';

describe('sanitizeSvgMarkup', () => {
  it('conserve les icones de type trait (Tabler) avec leurs attributs', () => {
    const out = sanitizeSvgMarkup(TABLER_PROGRESS_CHECK);

    expect(out).toContain('<svg');
    expect(out).toContain('d="M12 3a9 9 0 1 0 9 9"');
    expect(out).toContain('d="M9 12l2 2l4 -4"');
    expect(out).toContain('stroke="currentColor"');
    expect(out).toContain('stroke-linecap="round"');
    expect(out).toContain('fill="none"');
  });

  it('accepte un svg sans attribut xmlns (valide en HTML inline)', () => {
    const out = sanitizeSvgMarkup('<svg viewBox="0 0 24 24"><path d="M12 2l10 20H2z"/></svg>');

    expect(out).toContain('viewBox="0 0 24 24"');
    expect(out).toContain('d="M12 2l10 20H2z"');
  });

  it('retire scripts, handlers, liens, style et elements non autorises', () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)" style="fill:red">' +
      '<script>alert(1)</script>' +
      '<style>path{fill:red}</style>' +
      '<path d="M1 1" onclick="alert(2)" style="x:y"/>' +
      '<path xlink:href="javascript:alert(3)" d="M2 2"/>' +
      '<a href="javascript:alert(4)"><circle r="2"/></a>' +
      '<foreignObject><div>x</div></foreignObject>' +
      '<use href="#evil"/>' +
      '<image href="https://example.com/x.png"/>' +
      '</svg>';

    const out = sanitizeSvgMarkup(malicious);

    expect(out).toContain('d="M1 1"');
    expect(out).toContain('d="M2 2"');
    expect(out).not.toContain('script');
    expect(out).not.toContain('style');
    expect(out).not.toContain('onload');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('href');
    expect(out).not.toContain('javascript');
    expect(out).not.toContain('<a');
    expect(out).not.toContain('circle');
    expect(out).not.toContain('foreignObject');
    expect(out).not.toContain('use');
    expect(out).not.toContain('image');
    expect(out).not.toContain('alert');
  });

  it('renvoie une chaine vide pour un markup absent, non SVG ou mal forme', () => {
    expect(sanitizeSvgMarkup(undefined)).toBe('');
    expect(sanitizeSvgMarkup(null)).toBe('');
    expect(sanitizeSvgMarkup('')).toBe('');
    expect(sanitizeSvgMarkup('<div><script>alert(1)</script></div>')).toBe('');
    expect(sanitizeSvgMarkup('<svg><path d="M0 0"></svg>')).toBe('');
  });
});
