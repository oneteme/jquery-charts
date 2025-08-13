import { EventEmitter, NgZone } from '@angular/core';
import { setupToolbar } from '../directive/utils/chart-toolbar';

type Ev = 'previous' | 'next' | 'pivot';

function makeNgZoneStub(): NgZone {
  return {
    run: (fn: any) => fn(),
    runOutsideAngular: (fn: any) => fn(),
  } as any;
}

function makeFakeChart(overrides: any = {}) {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.paddingRight = '40px'; // Simule un conteneur paddé

  const options: any = {
    chart: { events: {} },
    exporting: { enabled: true, buttons: { contextButton: { enabled: true } } },
    title: { text: '' },
    subtitle: { text: '' },
  };
  return {
    container,
    options: { ...options, ...(overrides.options || {}) },
    update: jasmine.createSpy('update'),
  } as any;
}

describe('Toolbar + Exporting DOM', () => {
  it('dans un container paddé, la toolbar n\'empiète pas sur le bouton d\'export', () => {
    const chart = makeFakeChart();
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: true });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();

    // Simule la présence du bouton d'export Highcharts
    const exportBtn = document.createElement('div');
    exportBtn.className = 'highcharts-contextbutton';
    exportBtn.style.position = 'absolute';
    exportBtn.style.top = '0.5em';
    exportBtn.style.right = '0.5em';
    exportBtn.style.width = '32px';
    exportBtn.style.height = '24px';
    chart.container.appendChild(exportBtn);

    // Vérifie que la toolbar est décalée (right en em)
    expect(toolbar.style.right).toBe('2.5em');
    expect(toolbar.style.top).toBe('0.8em');
  });

  it('sans exporting, la toolbar colle à droite', () => {
    const chart = makeFakeChart({ options: { exporting: { enabled: false } } });
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: false });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();
    expect(toolbar.style.right).toBe('3px');
    expect(toolbar.style.top).toBe('10px');
  });

  it('clique sur previous/next/pivot émet les événements', (done) => {
    const chart = makeFakeChart();
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    const received: Ev[] = [];
    emitter.subscribe((ev) => {
      received.push(ev);
      if (received.length === 3) {
        expect(received).toEqual(['previous', 'next', 'pivot']);
        done();
      }
    });

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: true });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    const buttons = toolbar.querySelectorAll('button.custom-icon');
    expect(buttons.length).toBe(3);

    // previous, next, pivot dans l'ordre
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();
    (buttons[2] as HTMLButtonElement).click();
  });
});
