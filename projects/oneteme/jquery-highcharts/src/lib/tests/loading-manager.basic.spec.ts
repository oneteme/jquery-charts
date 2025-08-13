import { ElementRef } from '@angular/core';
import { LoadingManager } from '../directive/utils/loading-manager';

describe('LoadingManager - basiques', () => {
  function makeHost(): HTMLElement {
    const el = document.createElement('div');
    el.style.width = '300px';
    el.style.height = '200px';
    return el;
  }

  function makeRef(el: HTMLElement): ElementRef {
    return { nativeElement: el } as any;
  }

  it('show() crée un overlay et visible passe à true; hide() le retire', () => {
    const host = makeHost();
    const lm = new LoadingManager(makeRef(host));

    lm.show();
    expect(lm.visible).toBeTrue();
    expect(host.querySelector('.highcharts-loading-overlay')).toBeTruthy();

    lm.hide();
    expect(lm.visible).toBeFalse();
    expect(host.querySelector('.highcharts-loading-overlay')).toBeFalsy();
  });

  it('showNoData() crée un overlay no-data et noDataVisible passe à true; hideNoData() le retire', () => {
    const host = makeHost();
    const lm = new LoadingManager(makeRef(host));

    lm.showNoData('Rien');
    expect(lm.noDataVisible).toBeTrue();
    const nd = host.querySelector('.highcharts-no-data-overlay');
    expect(nd).toBeTruthy();
    expect(nd?.textContent || '').toContain('Rien');

    lm.hideNoData();
    expect(lm.noDataVisible).toBeFalse();
    expect(host.querySelector('.highcharts-no-data-overlay')).toBeFalsy();
  });

  it('updateConfig() redessine l’UI visible', () => {
    const host = makeHost();
    const lm = new LoadingManager(makeRef(host), { showSpinner: true, showText: true });

    lm.show('Chargement');
    const before = host.querySelector('.loading-text');
    expect(before).toBeTruthy();
    expect(before?.textContent || '').toContain('Chargement');

    lm.updateConfig({ text: 'Nouveau texte' });
    const after = host.querySelector('.loading-text');
    expect(after).toBeTruthy();
    expect(after?.textContent || '').toContain('Nouveau texte');
  });

  it('destroy() nettoie tout', () => {
    const host = makeHost();
    const lm = new LoadingManager(makeRef(host));

    lm.show();
    lm.showNoData();
  // showNoData() cache le loading overlay
  expect(lm.visible).toBeFalse();
  expect(lm.noDataVisible).toBeTrue();

    lm.destroy();
    expect(lm.visible).toBeFalse();
    expect(lm.noDataVisible).toBeFalse();
    expect(host.querySelector('.highcharts-loading-overlay')).toBeFalsy();
    expect(host.querySelector('.highcharts-no-data-overlay')).toBeFalsy();
  });
});
