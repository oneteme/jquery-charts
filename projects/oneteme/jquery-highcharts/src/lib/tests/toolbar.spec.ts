import { EventEmitter, NgZone } from '@angular/core';
import { setupToolbar, removeToolbar, configureChartEvents } from '../directive/utils/chart-toolbar';
type Ev = 'previous' | 'next' | 'pivot';

// Fake minimal Highcharts-like chart for DOM interactions
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

function makeNgZoneStub(): NgZone {
  return {
    run: (fn: any) => fn(),
    runOutsideAngular: (fn: any) => fn(),
  } as any;
}

describe('Toolbar', () => {
  it('setupToolbar: ajoute la toolbar et les boutons (previous/next/pivot) et gère la visibilité', () => {
    const chart = makeFakeChart();
    const config: any = { showToolbar: true };
  const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    setupToolbar({ chart, config, customEvent: emitter as any, ngZone, canPivot: true });

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    expect(toolbar).toBeTruthy();

    const buttons = toolbar.querySelectorAll('button.custom-icon');
    expect(buttons.length).toBe(3); // previous, next, pivot

    // Visibilité via mousemove/mouseleave
    expect(toolbar.style.visibility).toBe('hidden');
    chart.container.dispatchEvent(new Event('mousemove'));
    expect(toolbar.style.visibility).toBe('visible');
    chart.container.dispatchEvent(new Event('mouseleave'));
    expect(toolbar.style.visibility).toBe('hidden');

    // removeToolbar supprime la barre
    removeToolbar(chart);
    const after = chart.container.querySelector('.highcharts-custom-toolbar');
    expect(after).toBeNull();
  });

  it('configureChartEvents: configure le render pour installer la toolbar', () => {
    const chart = makeFakeChart();
    const config: any = { showToolbar: true };
  const emitter = new EventEmitter<Ev>();
    const ngZone = makeNgZoneStub();

    const chartOptions: any = { chart: { events: {} } };
    configureChartEvents(chartOptions, { chart: chart as any, config, customEvent: emitter as any, ngZone, canPivot: false });

    // Appel manuel de l'event render avec this=chart
    expect(typeof chartOptions.chart.events.render).toBe('function');
    (chartOptions.chart.events.render as Function).call(chart);

    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar');
    expect(toolbar).toBeTruthy();

    // Sans pivot
    const buttons = (toolbar as HTMLElement).querySelectorAll('button.custom-icon');
    expect(buttons.length).toBe(2);
  });

  it('émet des événements previous/next/pivot au clic', (done) => {
    const chart = makeFakeChart();
    const config: any = { showToolbar: true };
    const emitter = new EventEmitter<'previous' | 'next' | 'pivot'>();
    const ngZone = makeNgZoneStub();

    const received: string[] = [];
    emitter.subscribe((ev) => {
      received.push(ev as string);
      if (received.length === 3) {
        expect(received).toEqual(['previous','next','pivot']);
        done();
      }
    });

    setupToolbar({ chart, config, customEvent: emitter as any, ngZone, canPivot: true });
    const toolbar = chart.container.querySelector('.highcharts-custom-toolbar') as HTMLDivElement;
    const [btnPrev, btnNext, btnPivot] = Array.from(toolbar.querySelectorAll('button.custom-icon')) as HTMLButtonElement[];
    btnPrev.click();
    btnNext.click();
    btnPivot.click();
  });
});
