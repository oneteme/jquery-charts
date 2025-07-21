import { ElementRef } from '@angular/core';

export interface LoadingConfig {
  text?: string;
  showText?: boolean;
  showSpinner?: boolean;
  backgroundColor?: string;
  textColor?: string;
  spinnerColor?: string;

  // Config "aucune donnée"
  noDataMessage?: string;
  showNoDataBackground?: boolean;
  noDataBackgroundColor?: string;
  noDataBorderColor?: string;
  noDataTextColor?: string;
  showNoDataIcon?: boolean;
  noDataIcon?: string;
}

const DEFAULT_CONFIG: Required<LoadingConfig> = {
  // Loading par défaut
  text: 'Chargement des données...',
  showText: true,
  showSpinner: false,
  backgroundColor: '#ffffff',
  textColor: '#666666',
  spinnerColor: '#0066cc',

  // "Aucune donnée" par défaut
  noDataMessage: 'Aucune donnée disponible',
  showNoDataBackground: false,
  noDataBackgroundColor: '#fafafa',
  noDataBorderColor: '#ddd',
  noDataTextColor: '#666666',
  showNoDataIcon: false,
  noDataIcon: '📊',
};

export class LoadingManager {
  private overlay: HTMLElement | null = null;
  private noDataElement: HTMLElement | null = null;
  private isLoadingVisible: boolean = false;
  private isNoDataVisible: boolean = false;
  private readonly config: Required<LoadingConfig>;

  constructor(
    private readonly elementRef: ElementRef,
    config: LoadingConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.addSpinnerAnimation();
  }

  show(customText?: string): void {
    if (this.isLoadingVisible) return;

    const container = this.elementRef.nativeElement;
    if (!container) return;

    this.hideNoData();
    this.ensureContainerCanHost(container);
    this.createLoadingOverlay(customText);
    container.appendChild(this.overlay);
    this.isLoadingVisible = true;
  }

  hide(): void {
    if (!this.isLoadingVisible || !this.overlay) return;

    this.removeLoadingOverlay();
    this.isLoadingVisible = false;
  }

  showNoData(customMessage?: string): void {
    if (this.isNoDataVisible) return;

    const container = this.elementRef.nativeElement;
    if (!container) return;

    this.hide();
    this.ensureContainerCanHost(container);
    this.createNoDataElement(customMessage);
    container.appendChild(this.noDataElement);
    this.isNoDataVisible = true;
  }

  hideNoData(): void {
    if (!this.isNoDataVisible || !this.noDataElement) return;

    this.removeNoDataElement();
    this.isNoDataVisible = false;
  }

  destroy(): void {
    this.removeLoadingOverlay();
    this.removeNoDataElement();
    this.isLoadingVisible = false;
    this.isNoDataVisible = false;
  }

  get visible(): boolean {
    return this.isLoadingVisible;
  }

  get noDataVisible(): boolean {
    return this.isNoDataVisible;
  }

  private ensureContainerCanHost(container: HTMLElement): void {
    const computedStyle = getComputedStyle(container);
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }
  }

  private createLoadingOverlay(customText?: string): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'highcharts-loading-overlay';

    const displayText = customText || this.config.text;

    this.overlay.innerHTML = `
      <div class="loading-content">
        ${this.config.showSpinner ? '<div class="loading-spinner"></div>' : ''}
        ${this.config.showText && displayText ? `<div class="loading-text">${displayText}</div>` : ''}
      </div>
    `;

    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${this.config.backgroundColor};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: inherit;
    `;

    const content = this.overlay.querySelector('.loading-content') as HTMLElement;
    if (content) {
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
      `;
    }

    if (this.config.showSpinner) {
      const spinner = this.overlay.querySelector('.loading-spinner') as HTMLElement;
      if (spinner) {
        const spinnerColorWithOpacity = this.hexToRgba(this.config.spinnerColor, 0.2);

        spinner.style.cssText = `
          width: 40px;
          height: 40px;
          border: 3px solid ${spinnerColorWithOpacity};
          border-top: 3px solid ${this.config.spinnerColor};
          border-radius: 50%;
          animation: highcharts-loading-spin 1s linear infinite;
        `;
      }
    }

    if (this.config.showText) {
      const text = this.overlay.querySelector('.loading-text') as HTMLElement;
      if (text) {
        text.style.cssText = `
          color: ${this.config.textColor};
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
      }
    }
  }

  private createNoDataElement(customMessage?: string): void {
    this.noDataElement = document.createElement('div');
    this.noDataElement.className = 'highcharts-no-data-overlay';

    const displayMessage = customMessage || this.config.noDataMessage;

    this.noDataElement.innerHTML = `
      <div class="no-data-content">
        ${this.config.showNoDataIcon ? `<div class="no-data-icon">${this.config.noDataIcon}</div>` : ''}
        <div class="no-data-text">${displayMessage}</div>
      </div>
    `;

    // Style de base : toujours centré
    let baseStyle = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: inherit;
      pointer-events: none;
    `;

    // Ajouter le background et la bordure seulement si demandé
    if (this.config.showNoDataBackground) {
      baseStyle += `
        background-color: ${this.config.noDataBackgroundColor};
        border: 1px dashed ${this.config.noDataBorderColor};
      `;
    }

    this.noDataElement.style.cssText = baseStyle;

    const content = this.noDataElement.querySelector('.no-data-content') as HTMLElement;
    if (content) {
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        color: ${this.config.noDataTextColor};
      `;
    }

    if (this.config.showNoDataIcon) {
      const icon = this.noDataElement.querySelector('.no-data-icon') as HTMLElement;
      if (icon) {
        icon.style.cssText = `
          font-size: 48px;
          opacity: 0.5;
        `;
      }
    }

    const text = this.noDataElement.querySelector('.no-data-text') as HTMLElement;
    if (text) {
      text.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        font-weight: 500;
      `;
    }
  }

  private hexToRgba(hex: string, opacity: number): string {
    hex = hex.replace('#', '');

    if (hex.startsWith('rgb')) {
      return hex.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }

    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    if (hex.length === 8) {
      hex = hex.substring(0, 6);
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private addSpinnerAnimation(): void {
    const styleId = 'highcharts-loading-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes highcharts-loading-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  private removeLoadingOverlay(): void {
    if (this.overlay?.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  private removeNoDataElement(): void {
    if (this.noDataElement?.parentNode) {
      this.noDataElement.parentNode.removeChild(this.noDataElement);
    }
    this.noDataElement = null;
  }
}
