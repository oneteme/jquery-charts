export class FullscreenManager {
  static isSupported(element?: Element): boolean {
    return typeof document !== 'undefined'
      && !!element
      && typeof element.requestFullscreen === 'function'
      && typeof document.exitFullscreen === 'function';
  }

  static isActive(element: Element): boolean {
    return typeof document !== 'undefined' && document.fullscreenElement === element;
  }

  static async toggle(element: Element): Promise<boolean> {
    if (!this.isSupported(element)) return false;
    try {
      if (this.isActive(element)) {
        await document.exitFullscreen();
        return false;
      }
      await element.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }
}
