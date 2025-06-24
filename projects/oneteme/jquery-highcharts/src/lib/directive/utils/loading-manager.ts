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
  text: '', // Supprimé le texte par défaut
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

    // S'assurer que le conteneur peut héberger du contenu positionné
    this.ensureContainerCanHost(container);

    this.createOverlay();
    container.appendChild(this.overlay);

    // Animation d'apparition
    requestAnimationFrame(() => {
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

      // Animation de disparition
      this.overlay.style.opacity = '0';

      setTimeout(() => {
        this.removeOverlay();
        this.isVisible = false;
        resolve();
      }, this.config.fadeOutDuration);
    });
  }

  updateText(text: string): void {
    // Méthode conservée pour compatibilité mais ne fait plus rien
    // car nous n'affichons plus de texte
  }

  destroy(): void {
    this.removeOverlay();
    this.isVisible = false;
  }

  get visible(): boolean {
    return this.isVisible;
  }

  private ensureContainerCanHost(container: HTMLElement): void {
    const computedStyle = getComputedStyle(container);

    // S'assurer que le conteneur peut héberger du contenu positionné
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }

    // Créer un contexte de superposition pour empêcher le débordement
    if (computedStyle.zIndex === 'auto') {
      container.style.zIndex = '1';
    }

    // S'assurer que le overflow est contrôlé
    if (computedStyle.overflow === 'visible') {
      container.style.overflow = 'hidden';
    }

    // Ne pas forcer de dimensions, mais s'assurer que le conteneur
    // hérite correctement des dimensions de son parent
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

    // L'overlay utilise position absolute avec un z-index modéré
    // pour rester dans le contexte de son conteneur
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
