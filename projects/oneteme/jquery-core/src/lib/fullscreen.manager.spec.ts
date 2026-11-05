import { FullscreenManager } from './fullscreen.manager';

describe('FullscreenManager', () => {
  function fakeElement(overrides: Partial<Record<'requestFullscreen', () => Promise<void>>> = {}): Element {
    return { ...overrides } as unknown as Element;
  }

  describe('isSupported', () => {
    it('is false without an element', () => {
      expect(FullscreenManager.isSupported()).toBeFalse();
    });

    it('is false when the element cannot enter fullscreen', () => {
      expect(FullscreenManager.isSupported(fakeElement())).toBeFalse();
    });

    it('is true for a real element when the browser supports the Fullscreen API', () => {
      const element = document.createElement('div');
      const expected = typeof element.requestFullscreen === 'function'
        && typeof document.exitFullscreen === 'function';
      expect(FullscreenManager.isSupported(element)).toBe(expected);
    });
  });

  describe('isActive', () => {
    it('is false when the element is not the fullscreen element', () => {
      expect(FullscreenManager.isActive(document.createElement('div'))).toBeFalse();
    });
  });

  describe('toggle', () => {
    it('returns false when fullscreen is unsupported for the element', async () => {
      expect(await FullscreenManager.toggle(fakeElement())).toBeFalse();
    });

    it('returns false when entering fullscreen is rejected by the browser', async () => {
      const element = fakeElement({ requestFullscreen: () => Promise.reject(new Error('denied')) });
      const supported = FullscreenManager.isSupported(element);
      expect(supported).toBeTrue();
      expect(await FullscreenManager.toggle(element)).toBeFalse();
    });

    it('requests fullscreen and returns true when the browser grants it', async () => {
      const requestFullscreen = jasmine.createSpy('requestFullscreen').and.returnValue(Promise.resolve());
      const element = fakeElement({ requestFullscreen });
      expect(await FullscreenManager.toggle(element)).toBeTrue();
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
    });
  });
});
