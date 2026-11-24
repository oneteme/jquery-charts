import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ChartExampleNavigationService } from './chart-example-navigation.service';
import { ChartsShellComponent } from './charts-shell.component';

describe('ChartsShellComponent', () => {
  let fixture: ComponentFixture<ChartsShellComponent>;
  let component: ChartsShellComponent;
  let navigation: ChartExampleNavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChartsShellComponent],
      providers: [provideRouter([])],
    });
    navigation = TestBed.inject(ChartExampleNavigationService);
  });

  function createAt(url: string): void {
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue(url);
    fixture = TestBed.createComponent(ChartsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('conserve l exemple courant lorsque les autres bibliothèques le supportent', () => {
    createAt('/charts/echarts/rangeBar');

    expect(component.libraryRoute('/charts/apexcharts')).toEqual(['/charts/apexcharts', 'rangeBar']);
  });

  it('revient à la galerie de la bibliothèque qui ne supporte pas l exemple courant', () => {
    createAt('/charts/highcharts/spline');

    expect(component.libraryRoute('/charts/apexcharts')).toEqual(['/charts/apexcharts']);
  });

  it('propose la galerie sans exemple lorsqu on est sur une galerie', () => {
    createAt('/charts/echarts');

    expect(component.libraryRoute('/charts/echarts')).toEqual(['/charts/echarts']);
    expect(component.libraryRoute('/charts/highcharts')).toEqual(['/charts/highcharts']);
  });

  it('transmet l exemple sélectionné depuis la galerie aux autres bibliothèques', () => {
    createAt('/charts/echarts');

    navigation.setCurrentExample('bar');

    expect(component.libraryRoute('/charts/highcharts')).toEqual(['/charts/highcharts', 'bar']);
  });
});
