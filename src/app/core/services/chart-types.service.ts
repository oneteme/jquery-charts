import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChartTypesService {
  private readonly chartTypes = [
    'Pie Chart',
    'Donut Chart',
    'Bar Chart',
    'Line Chart',
    'Spline Chart',
    'Scatter Chart',
    'Bubble Chart',
    'Treemap Chart',
    'Heatmap Chart',
    'Range Chart',
    'Funnel Chart',
    'Polar Chart',
    'Radar Chart',
    'Radial Bar Chart',
    'Combo Chart',
    'Map Chart',
  ];

  private readonly selectedChartType = new BehaviorSubject<string | null>(null);

  getChartTypes() {
    return this.chartTypes;
  }

  setSelectedType(type: string | null) {
    this.selectedChartType.next(type);
  }

  getSelectedType() {
    return this.selectedChartType.asObservable();
  }

  resetSelectedType() {
    this.selectedChartType.next(null);
  }
}
