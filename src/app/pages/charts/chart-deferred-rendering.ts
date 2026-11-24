export interface DeferredChartRendering {
  isRendered(id: string): boolean;
  stop(): void;
}

function findScrollContainer(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
  }
  return null;
}

export function trackDeferredChartRendering(
  hostElement: HTMLElement,
  onRender: () => void,
): DeferredChartRendering {
  const rendered = new Set<string>();

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const id = (entry.target as HTMLElement).dataset.chartExample;
        if (!id || rendered.has(id)) continue;
        rendered.add(id);
        onRender();
      }
    },
    // The page scrolls inside this container, which clips its children: it must be the root for rootMargin to apply.
    { root: findScrollContainer(hostElement), rootMargin: '600px 0px' },
  );

  hostElement
    .querySelectorAll<HTMLElement>('[data-chart-example]')
    .forEach(element => observer.observe(element));

  return {
    isRendered: id => rendered.has(id),
    stop: (): void => observer.disconnect(),
  };
}
