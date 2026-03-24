import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartProvider, ChartType, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartDirective } from '../directive/chart.directive';
import { ChartCustomEvent } from '../directive/utils/types';

@Component({
  standalone: true,
  imports: [CommonModule, ChartDirective],
  selector: 'chart',
  templateUrl: './chart.component.html',
  styles: [`:host { display: block; width: 100%; height: 100%; }`],
})
export class ChartComponent<X extends XaxisType, Y extends YaxisType> {

  @Input({ required: true }) type: ChartType;
  @Input({ required: true }) config: ChartProvider<X, Y>;
  @Input({ required: true }) data: any[];

  @Input() isLoading: boolean;
  @Input() debug: boolean;
  @Input() theme: string | null = null;
  @Input() renderer: 'svg' | 'canvas' = 'svg';
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
}
