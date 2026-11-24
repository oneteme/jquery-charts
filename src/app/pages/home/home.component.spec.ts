import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChartDrilldownRequest } from '@oneteme/jquery-core';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('calcule la moyenne du chiffre d’affaires par région et normalise la barre maximale', () => {
    component.productOrganizerState = {
      ...component.productOrganizerState,
      selectedX: 'region',
      selectedY: 'revenue',
      selectedYAggregate: 'average',
    };

    const rows = component.organizerResultRows;

    expect(rows[0].label).toBe('Nord');
    expect(rows[0].value).toBeCloseTo(39573.33, 2);
    expect(rows[0].width).toBe(100);
    expect(rows.every(row => row.width >= 12 && row.width <= 100)).toBeTrue();
  });

  it('formate la marge moyenne en pourcentage avec une décimale', () => {
    component.productOrganizerState = {
      ...component.productOrganizerState,
      selectedX: 'month',
      selectedY: 'margin',
      selectedYAggregate: 'average',
    };

    expect(component.organizerResultRows[0].formattedValue).toBe('31.0 %');
  });

  it('affiche le total des commandes sans suffixe monétaire', () => {
    component.productOrganizerState = {
      ...component.productOrganizerState,
      selectedY: 'orders',
      selectedYAggregate: 'sum',
    };

    expect(component.organizerResultTotal).toBe((2083).toLocaleString('fr-FR'));
  });

  it('passe au détail journalier lors d’un drilldown sur un mois puis revient aux mois', () => {
    component.onProductChartDrilldown({ toLevel: 'days', value: 'Mar' } as ChartDrilldownRequest);

    expect(component.productChartData.length).toBe(30);
    expect(component.productChartDrilldown.activeLevel).toBe('days');
    expect(component.productChartConfig.title).toBe('Mar · détail journalier');

    component.onProductChartNavigate('months');

    expect(component.productChartData.length).toBe(12);
    expect(component.productChartDrilldown.activeLevel).toBe('months');
    expect(component.productChartConfig.title).toBe('Performance annuelle');
  });

  it('ignore un drilldown vers un niveau autre que les jours', () => {
    component.onProductChartDrilldown({ toLevel: 'months', value: 'Mar' } as ChartDrilldownRequest);

    expect(component.productChartData.length).toBe(12);
    expect(component.productChartDrilldown.activeLevel).toBe('months');
  });
});
