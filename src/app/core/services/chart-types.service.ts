import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChartTypesService {
  private chartTypes = [
    'Pie Chart',
    'Bar Chart',
    'Line Chart',
    'Treemap Chart',
    'Heatmap Chart',
    'Range Chart',
    'Funnel Chart',
  ];

  private selectedChartType = new BehaviorSubject<string | null>(null);

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
