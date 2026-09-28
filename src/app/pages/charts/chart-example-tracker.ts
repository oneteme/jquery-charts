export function trackVisibleChartExample(
  hostElement: HTMLElement,
  onChange: (id: string) => void,
): () => void {
  const exampleElements = Array.from(
    hostElement.querySelectorAll<HTMLElement>('[data-chart-example]')
  );
  if (!exampleElements.length) return () => undefined;

  const scrollContainer = hostElement.closest<HTMLElement>('.shell-content');
  let currentElement: HTMLElement | null = null;
  let frameId: number | null = null;

  const updateCurrentExample = (element: HTMLElement): void => {
    const id = element.dataset.chartExample;
    if (!id || element === currentElement) return;

    currentElement = element;
    onChange(id);
  };

  const updateFromViewport = (): void => {
    const containerBounds = scrollContainer?.getBoundingClientRect();
    const viewportTop = containerBounds?.top ?? 0;
    const viewportBottom = containerBounds?.bottom ?? window.innerHeight;
    const viewportHeight = viewportBottom - viewportTop;
    const anchor = viewportTop + Math.min(240, Math.max(96, viewportHeight * 0.3));

    let closestElement: HTMLElement | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const element of exampleElements) {
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom <= viewportTop || bounds.top >= viewportBottom) continue;
      const distance = Math.abs(bounds.top - anchor);
      if (distance < closestDistance) {
        closestElement = element;
        closestDistance = distance;
      }
    }

    if (closestElement) updateCurrentExample(closestElement);
  };

  const scheduleViewportUpdate = (): void => {
    if (frameId !== null) return;
    frameId = window.requestAnimationFrame(() => {
      frameId = null;
      updateFromViewport();
    });
  };

  const handlePointerEnter = (event: Event): void => {
    updateCurrentExample(event.currentTarget as HTMLElement);
  };

  for (const element of exampleElements) {
    element.addEventListener('pointerenter', handlePointerEnter);
    element.addEventListener('focusin', handlePointerEnter);
  }

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
  } else {
    window.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
  }
  window.addEventListener('resize', scheduleViewportUpdate);
  scheduleViewportUpdate();

  return (): void => {
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    for (const element of exampleElements) {
      element.removeEventListener('pointerenter', handlePointerEnter);
      element.removeEventListener('focusin', handlePointerEnter);
    }
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', scheduleViewportUpdate);
    } else {
      window.removeEventListener('scroll', scheduleViewportUpdate);
    }
    window.removeEventListener('resize', scheduleViewportUpdate);
  };
}