import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  private chartsSubject = new BehaviorSubject<any[]>([]);
  charts$ = this.chartsSubject.asObservable();

  updateCharts(charts: any[]) {
    console.log('Updating charts:', charts);
    this.chartsSubject.next(charts);
  }
}