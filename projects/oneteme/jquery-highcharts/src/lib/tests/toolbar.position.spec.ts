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

describe('Toolbar positionnement', () => {
  it('sans exporting: toolbar à droite (right=3px, top=10px)', () => {
    const chart = makeFakeChart({ options: { exporting: { enabled: false } } });
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: true });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();
    expect(toolbar.style.right).toBe('3px');
    expect(toolbar.style.top).toBe('10px');
  });

  it('exporting actif + contextButton désactivé: toolbar à droite (right=3px, top=10px)', () => {
    const chart = makeFakeChart({ options: { exporting: { enabled: true, buttons: { contextButton: { enabled: false } } } } });
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: false });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();
    expect(toolbar.style.right).toBe('3px');
    expect(toolbar.style.top).toBe('10px');
  });

  it('exporting + contextButton actifs: toolbar décalée (right=2.5em, top=0.8em)', () => {
    const chart = makeFakeChart({ options: { exporting: { enabled: true, buttons: { contextButton: { enabled: true } } } } });
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: true });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();
    expect(toolbar.style.right).toBe('2.5em');
    expect(toolbar.style.top).toBe('0.8em');
  });

  it('ajuste spacingTop si pas de title/subtitle', () => {
    const chart = makeFakeChart({ options: { title: { text: '' }, subtitle: { text: '' } } });
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: true });

    expect(chart.update).toHaveBeenCalled();
    const args = (chart.update as any).calls.mostRecent().args[0];
    expect(args?.chart?.spacingTop).toBe(45);
  });
});
