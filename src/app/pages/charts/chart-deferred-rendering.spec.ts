import { trackDeferredChartRendering } from './chart-deferred-rendering';

describe('trackDeferredChartRendering', () => {
  let container: HTMLElement;
  let host: HTMLElement;

  function addChart(id: string, marginTop = 0): void {
    const element = document.createElement('section');
    element.dataset['chartExample'] = id;
    element.style.height = '200px';
    element.style.marginTop = `${marginTop}px`;
    host.appendChild(element);
  }

  function nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  async function waitFrames(count: number): Promise<void> {
    for (let frame = 0; frame < count; frame++) {
      await nextFrame();
    }
  }

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'shell-content';
    container.style.cssText = 'position:absolute;top:0;left:0;width:100%';
    host = document.createElement('div');
    container.appendChild(host);
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders visible charts without rendering the ones far below the viewport', async () => {
    addChart('visible');
    addChart('far', window.innerHeight + 1000);
    const onRender = jasmine.createSpy('onRender');

    const rendering = trackDeferredChartRendering(host, onRender);
    await waitFrames(10);

    expect(rendering.isRendered('visible')).toBe(true);
    expect(rendering.isRendered('far')).toBe(false);
    expect(onRender).toHaveBeenCalledTimes(1);
    rendering.stop();
  });

  it('does not render charts after being stopped', async () => {
    addChart('visible');
    const onRender = jasmine.createSpy('onRender');

    const rendering = trackDeferredChartRendering(host, onRender);
    rendering.stop();
    await waitFrames(10);

    expect(onRender).not.toHaveBeenCalled();
    expect(rendering.isRendered('visible')).toBe(false);
  });

  it('renders charts just below the visible area of a scroll container', async () => {
    const scroller = document.createElement('div');
    scroller.style.cssText = 'height:300px;overflow-y:auto';
    host.appendChild(scroller);
    const innerHost = document.createElement('div');
    scroller.appendChild(innerHost);
    host = innerHost;
    addChart('near', 500);
    addChart('far', 1500);
    const onRender = jasmine.createSpy('onRender');

    const rendering = trackDeferredChartRendering(host, onRender);
    await waitFrames(10);

    expect(rendering.isRendered('near')).toBe(true);
    expect(rendering.isRendered('far')).toBe(false);
    rendering.stop();
  });
});
