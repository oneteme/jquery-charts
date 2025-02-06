import { Component, Input } from '@angular/core';
import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-chart-group',
  styleUrls: ['./chart-group.component.scss'],
  template: `
    <div class="chart-group">
      <div class="chart-group__header">
        <div class="divider"></div>
        <h3>{{ title }}</h3>
        <div class="divider"></div>
      </div>
      <div class="chart-grid">
        <ng-container *ngFor="let row of rows">
          <div class="chart-container" *ngFor="let chart of row">
            <chart [type]="type" [config]="chart.config" [data]="chart.data" />
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class ChartGroupComponent {
  @Input() title: string = '';
  @Input() type: string = '';
  @Input() rows: Array<
    Array<{
      config: ChartProvider<XaxisType, YaxisType>;
      data: any[];
    }>
  > = [];
}
