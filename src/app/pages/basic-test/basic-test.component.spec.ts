import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChartType } from '@oneteme/jquery-core';
import { OrganizerButtonEvent } from '@oneteme/jquery-organizer';
import { ChartWorkbenchComponent } from './basic-test.component';

describe('ChartWorkbenchComponent', () => {
  let component: ChartWorkbenchComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ChartWorkbenchComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(ChartWorkbenchComponent).componentInstance;
  });

  it('change de type uniquement parmi les types supportés par la bibliothèque courante', () => {
    component.setChartType('sankey' as ChartType);
    expect(component.chartType).toBe('line');

    component.setChartType('pie');
    expect(component.chartType).toBe('pie');
  });

  it('conserve le type si la nouvelle bibliothèque le supporte, sinon retombe sur le premier type disponible', () => {
    component.setChartType('bubble');

    component.setLibrary('apexcharts');

    expect(component.chartType).not.toBe('bubble');
    expect(component.availableTypes.map(section => section.type)).toContain(component.chartType);
    expect(component.organizerMenuState.selectedChartType).toBe(component.chartType);
  });

  it('expose à l’organizer uniquement les types de la bibliothèque sélectionnée', () => {
    component.setLibrary('apexcharts');

    const organizerTypes = component.organizerMenuConfig.chartTypes?.map(type => type.id);
    expect(organizerTypes).toEqual(component.availableTypes.map(section => section.type));
    expect(organizerTypes).not.toContain('bubble');
  });

  it('applique uniquement la dernière demande de données lors de changements rapprochés', fakeAsync(() => {
    component.loadChartData();

    component.setDataMode('compact');
    tick(180);

    expect(component.isLoadingData).toBeFalse();
    expect(component.chartData.length).toBe(5);
    expect(component.chartConfig.title).toBe('Répartition par équipe');
  }));

  it('signale le chargement pendant le délai puis fournit les données', fakeAsync(() => {
    component.setDataMode('compact');

    expect(component.isLoadingData).toBeTrue();
    expect(component.chartData).toEqual([]);

    tick(180);

    expect(component.isLoadingData).toBeFalse();
    expect(component.chartData.length).toBe(5);
  }));

  it('retire de la configuration effective les séries masquées dans l’organizer', () => {
    component.onOrganizerChange({
      type: 'fieldToggled',
      state: { visibleFields: ['Ventes'] },
    } as OrganizerButtonEvent);

    expect(component.effectiveChartConfig.series?.map(series => series.name)).toEqual(['Ventes']);
  });

  it('recharge les données lorsque le type est choisi depuis l’organizer', fakeAsync(() => {
    component.onOrganizerChange({
      type: 'chartTypeSelected',
      state: { visibleFields: ['Ventes', 'Objectif'], selectedChartType: 'donut' },
    } as OrganizerButtonEvent);

    expect(component.chartType).toBe('donut');
    expect(component.isLoadingData).toBeTrue();
    tick(180);
    expect(component.isLoadingData).toBeFalse();
  }));
});
