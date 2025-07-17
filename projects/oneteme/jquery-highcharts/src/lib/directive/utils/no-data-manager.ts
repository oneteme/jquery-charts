import { ElementRef } from '@angular/core';

export interface NoDataConfig {
  message?: string;
  icon?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  iconSize?: string;
  fontSize?: string;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

const DEFAULT_CONFIG: Required<NoDataConfig> = {
  message: 'Aucune donnée disponible',
  icon: '📊',
  backgroundColor: '#fafafa',
  borderColor: '#ddd',
  textColor: '#666',
  iconSize: '48px',
  fontSize: '16px',
  fadeInDuration: 300,
  fadeOutDuration: 200,
};

export class NoDataManager {
  private noDataElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private readonly config: Required<NoDataConfig>;

  constructor(
    private readonly elementRef: ElementRef,
    config: NoDataConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  show(customMessage?: string): void {
    if (this.isVisible) return;

    const container = this.elementRef.nativeElement;
    if (!container) return;

    this.ensureContainerCanHost(container);

    this.hide();

    this.createNoDataElement(customMessage || this.config.message);
    container.appendChild(this.noDataElement);

    requestAnimationFrame(() => {
      if (this.noDataElement) {
        this.noDataElement.style.opacity = '1';
        this.isVisible = true;
      }
    });
  }

  hide(): void {
    if (!this.isVisible || !this.noDataElement) return;

    this.noDataElement.style.opacity = '0';

    setTimeout(() => {
      this.removeNoDataElement();
      this.isVisible = false;
    }, this.config.fadeOutDuration);
  }

  updateMessage(message: string): void {
    if (!this.noDataElement || !this.isVisible) return;

    const textElement = this.noDataElement.querySelector('.no-data-text') as HTMLElement;
    if (textElement) {
      textElement.textContent = message;
    }
  }

  destroy(): void {
    this.removeNoDataElement();
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

    if (computedStyle.display === 'inline') {
      container.style.display = 'inline-block';
    }
  }

  private createNoDataElement(message: string): void {
    this.noDataElement = document.createElement('div');
    this.noDataElement.className = 'highcharts-no-data-message';

    this.noDataElement.innerHTML = `
      <div class="no-data-content">
        <div class="no-data-icon">${this.config.icon}</div>
        <div class="no-data-text">${message}</div>
      </div>
    `;

    this.noDataElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${this.config.backgroundColor};
      border: 1px dashed ${this.config.borderColor};
      border-radius: inherit;
      z-index: 10;
      opacity: 0;
      transition: opacity ${this.config.fadeInDuration}ms ease-in-out;
      pointer-events: none;
    `;

    const content = this.noDataElement.querySelector('.no-data-content') as HTMLElement;
    if (content) {
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        color: ${this.config.textColor};
      `;
    }

    const icon = this.noDataElement.querySelector('.no-data-icon') as HTMLElement;
    if (icon) {
      icon.style.cssText = `
        font-size: ${this.config.iconSize};
        opacity: 0.5;
      `;
    }

    const text = this.noDataElement.querySelector('.no-data-text') as HTMLElement;
    if (text) {
      text.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: ${this.config.fontSize};
        font-weight: 500;
      `;
    }
  }

  private removeNoDataElement(): void {
    if (this.noDataElement?.parentNode) {
      this.noDataElement.parentNode.removeChild(this.noDataElement);
    }
    this.noDataElement = null;
  }
}
