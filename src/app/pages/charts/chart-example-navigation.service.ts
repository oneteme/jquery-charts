import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChartExampleNavigationService {
  private readonly currentExampleSubject = new BehaviorSubject<string | null>(null);
  readonly currentExample$ = this.currentExampleSubject.asObservable();

  setCurrentExample(id: string): void {
    if (this.currentExampleSubject.value === id) return;
    this.currentExampleSubject.next(id);
  }

  reset(): void {
    if (this.currentExampleSubject.value === null) return;
    this.currentExampleSubject.next(null);
  }
}