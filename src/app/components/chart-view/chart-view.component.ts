import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartService } from '../../core/services/chart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chart-view',
  template: `
    <div *ngFor="let chartType of visibleChartTypes">
      <app-chart-group
        [title]="chartType.title"
        [type]="chartType.type"
        [rows]="chartType.rows">
      </app-chart-group>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      padding: 2rem;
    }
  `]
})
export class ChartViewComponent implements OnInit, OnDestroy {
  visibleChartTypes: any[] = [];
  private subscription: Subscription;

  constructor(private chartService: ChartService) {
    console.log('ChartViewComponent constructed');
  }

  ngOnInit() {
    console.log('ChartViewComponent initialized');
    this.subscription = this.chartService.charts$.subscribe({
      next: (charts) => {
        console.log('Received charts:', charts);
        console.log('First chart rows:', charts[0]?.rows);
        this.visibleChartTypes = charts;
      },
      error: (error) => console.error('Error receiving charts:', error)
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}