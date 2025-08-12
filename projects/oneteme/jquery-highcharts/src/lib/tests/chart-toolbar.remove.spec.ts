import { EventEmitter, NgZone } from '@angular/core';
import { setupToolbar, removeToolbar } from '../directive/utils/chart-toolbar';

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

  // Intercepte add/removeEventListener pour capturer les handlers
  const added: Record<string, EventListener[]> = {};
  const removed: Record<string, EventListener[]> = {};

  const origAdd = container.addEventListener.bind(container);
  const origRemove = container.removeEventListener.bind(container);

  (container as any).addEventListener = (type: string, listener: any, options?: any) => {
    (added[type] ||= []).push(listener);
    return origAdd(type as any, listener as any, options as any);
  };
  (container as any).removeEventListener = (type: string, listener: any, options?: any) => {
    (removed[type] ||= []).push(listener);
    return origRemove(type as any, listener as any, options as any);
  };

  return {
    container,
    options: { ...options, ...(overrides.options || {}) },
    update: jasmine.createSpy('update'),
    __added: added,
    __removed: removed,
  } as any;
}

describe('chart-toolbar: removeToolbar', () => {
  it('supprime la toolbar du DOM et détache les listeners mousemove/mouseleave', () => {
    const chart = makeFakeChart();
    const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config: { showToolbar: true } as any, customEvent: emitter as any, ngZone, canPivot: true });

    // Toolbar présente et listeners enregistrés
    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();
    expect(chart.__added['mousemove']?.length || 0).toBeGreaterThan(0);
    expect(chart.__added['mouseleave']?.length || 0).toBeGreaterThan(0);

    removeToolbar(chart as any);

    // Toolbar retirée
    const after = chart.container.querySelector('.highcharts-custom-toolbar');
    expect(after).toBeFalsy();

    // Listeners détachés avec les mêmes références
    expect(chart.__removed['mousemove']?.[0]).toBe(chart.__added['mousemove']?.[0]);
    expect(chart.__removed['mouseleave']?.[0]).toBe(chart.__added['mouseleave']?.[0]);
  });
});
