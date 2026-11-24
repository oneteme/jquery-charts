import { trackVisibleChartExample } from './chart-example-tracker';

describe('trackVisibleChartExample', () => {
  let container: HTMLElement;
  let host: HTMLElement;

  function rect(top: number, height: number): DOMRect {
    return { top, bottom: top + height, left: 0, right: 600, width: 600, height, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  }

  function addExample(id: string, top: number, height = 200): HTMLElement {
    const element = document.createElement('section');
    element.dataset['chartExample'] = id;
    element.getBoundingClientRect = () => rect(top, height);
    host.appendChild(element);
    return element;
  }

  function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'shell-content';
    container.getBoundingClientRect = () => rect(0, 600);
    host = document.createElement('div');
    container.appendChild(host);
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('ne fait rien et renvoie une fonction de nettoyage inoffensive sans exemple', () => {
    const onChange = jasmine.createSpy('onChange');
    const cleanup = trackVisibleChartExample(host, onChange);

    expect(() => cleanup()).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('signale l\'exemple le plus proche de l\'ancrage visible', async () => {
    addExample('bar', -400, 200);
    addExample('line', 100, 200);
    addExample('pie', 700, 200);
    const onChange = jasmine.createSpy('onChange');

    const cleanup = trackVisibleChartExample(host, onChange);
    await nextFrame();
    cleanup();

    expect(onChange).toHaveBeenCalledOnceWith('line');
  });

  it('ignore les exemples hors du conteneur visible', async () => {
    addExample('offscreen', 2000, 200);
    const onChange = jasmine.createSpy('onChange');

    const cleanup = trackVisibleChartExample(host, onChange);
    await nextFrame();
    cleanup();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('signale un exemple au survol', () => {
    const element = addExample('scatter', 5000, 200);
    const onChange = jasmine.createSpy('onChange');

    const cleanup = trackVisibleChartExample(host, onChange);
    element.dispatchEvent(new Event('pointerenter'));
    cleanup();

    expect(onChange).toHaveBeenCalledWith('scatter');
  });

  it('ne notifie pas deux fois de suite le même exemple', () => {
    const element = addExample('pie', 0, 200);
    const onChange = jasmine.createSpy('onChange');

    const cleanup = trackVisibleChartExample(host, onChange);
    element.dispatchEvent(new Event('focusin'));
    element.dispatchEvent(new Event('pointerenter'));
    cleanup();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ne notifie plus après nettoyage', () => {
    const element = addExample('pie', 0, 200);
    const onChange = jasmine.createSpy('onChange');

    const cleanup = trackVisibleChartExample(host, onChange);
    cleanup();
    element.dispatchEvent(new Event('pointerenter'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
