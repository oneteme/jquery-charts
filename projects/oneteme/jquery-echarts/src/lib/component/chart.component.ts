import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { ChartProvider, ChartType, ViewConfig, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartDirective, GroupSyncMode } from '../directive/chart.directive';
import { ChartCustomEvent } from '../directive/utils/types';
import { ChartViewFacade } from './view/chart-view.facade';

@Component({
  standalone: true,
  imports: [CommonModule, ChartDirective],
  selector: 'chart',
  templateUrl: './chart.component.html',
  styles: [`:host { display: block; width: 100%; height: 100%; }`],
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> implements OnChanges, OnDestroy {

  @Input({ required: true }) type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean;
  @Input() debug: boolean;
  @Input() theme: string | null = null;
  @Input() renderer: 'svg' | 'canvas' = 'svg';
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;

  /** Active la gestion de la visibilité des séries via le panneau View. */
  @Input() view?: ViewConfig;

  _effectiveConfig!: ChartProvider<X, Y>;

  readonly _viewFacade = new ChartViewFacade<X, Y>();

  @HostBinding('style.height') get hostHeight(): string | null {
    return this.config?.height ? `${this.config.height}px` : null;
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<any>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['view']) {
      if (this.config) {
        this._viewFacade.update(this.view ?? {}, this.config);
      }
      this._effectiveConfig = this.config ? this._viewFacade.getEffectiveProvider() : this.config;
    }
  }

  ngOnDestroy(): void {
    this._viewFacade.destroy();
  }
}
