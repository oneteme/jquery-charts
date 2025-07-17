import { ElementRef } from '@angular/core';

export interface LoadingConfig {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  spinnerColor?: string;
  overlayOpacity?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

const DEFAULT_CONFIG: Required<LoadingConfig> = {
  text: '',
  backgroundColor: '#ffffff',
  textColor: '#666666',
  spinnerColor: '#0066cc',
  overlayOpacity: 0.95,
  fadeInDuration: 200,
  fadeOutDuration: 300,
};

export class LoadingManager {
  private overlay: HTMLElement | null = null;
  private isVisible: boolean = false;
  private readonly config: Required<LoadingConfig>;
  private animationFrame: number | null = null;

  constructor(
    private readonly elementRef: ElementRef,
    config: LoadingConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  show(customText?: string): void {
    if (this.isVisible) return;

    const container = this.elementRef.nativeElement;
    if (!container) return;

    this.ensureContainerCanHost(container);

    this.createOverlay();
    container.appendChild(this.overlay);

    this.animationFrame = requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.style.opacity = '1';
        this.isVisible = true;
      }
    });
  }

  hide(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isVisible || !this.overlay) {
        resolve();
        return;
      }

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      this.overlay.style.opacity = '0';

      setTimeout(() => {
        this.removeOverlay();
        this.isVisible = false;
        resolve();
      }, this.config.fadeOutDuration);
    });
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.removeOverlay();
    this.isVisible = false;
  }

  get visible(): boolean {
    return this.isVisible;
  }

  private ensureContainerCanHost(container: HTMLElement): void {
    const computedStyle = getComputedStyle(container);

    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }

    if (computedStyle.zIndex === 'auto') {
      container.style.zIndex = '1';
    }

    if (computedStyle.overflow === 'visible') {
      container.style.overflow = 'hidden';
    }

    if (computedStyle.display === 'inline') {
      container.style.display = 'inline-block';
    }
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'highcharts-loading-overlay';

    // Juste le spinner, pas de texte
    this.overlay.innerHTML = `
      <div class="loading-spinner"></div>
    `;

    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${this.config.backgroundColor};
      opacity: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: opacity ${this.config.fadeInDuration}ms ease-in-out;
      border-radius: inherit;
      pointer-events: none;
      cursor: default;
    `;

    const spinner = this.overlay.querySelector(
      '.loading-spinner'
    ) as HTMLElement;
    if (spinner) {
      spinner.style.cssText = `
        width: 48px;
        height: 48px;
        border: 4px solid ${this.config.spinnerColor}20;
        border-top: 4px solid ${this.config.spinnerColor};
        border-radius: 50%;
        animation: spin 1s linear infinite;
        flex-shrink: 0;
      `;
    }
    this.addSpinnerAnimation();
  }

  private addSpinnerAnimation(): void {
    const styleId = 'highcharts-loading-styles';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  private removeOverlay(): void {
    if (this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }
}
