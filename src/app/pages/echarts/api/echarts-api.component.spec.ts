import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChartDrilldownRequest } from '@oneteme/jquery-echarts';
import { EChartsApiComponent } from './echarts-api.component';

describe('EChartsApiComponent', () => {
  let component: EChartsApiComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EChartsApiComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(EChartsApiComponent).componentInstance;
  });

  it('restreint les lignes aux sites de la région cliquée lors du drilldown', () => {
    component.onDrilldownRequest({ toLevel: 'site', value: 'Nord' } as ChartDrilldownRequest);

    expect(component.drilldownData.map(row => row.site)).toEqual(['Lille', 'Arras']);
    expect(component.drilldown.activeLevel).toBe('site');
  });

  it('ignore une demande de drilldown qui ne cible pas le niveau site', () => {
    const before = component.drilldownData;

    component.onDrilldownRequest({ toLevel: 'region', value: 'Nord' } as ChartDrilldownRequest);

    expect(component.drilldownData).toBe(before);
    expect(component.drilldown.activeLevel).toBe('region');
  });

  it('restaure toutes les régions quand l’utilisateur remonte au niveau région', () => {
    component.onDrilldownRequest({ toLevel: 'site', value: 'Sud' } as ChartDrilldownRequest);

    component.onDrilldownNavigate('region');

    expect(component.drilldownData.length).toBe(4);
    expect(component.drilldown.activeLevel).toBe('region');
  });

  it('garde les données filtrées quand la navigation cible un autre niveau que région', () => {
    component.onDrilldownRequest({ toLevel: 'site', value: 'Sud' } as ChartDrilldownRequest);
    const filtered = component.drilldownData;

    component.onDrilldownNavigate('site');

    expect(component.drilldownData).toBe(filtered);
    expect(component.drilldown.activeLevel).toBe('site');
  });

  it('rend le chargement et l’absence de données mutuellement exclusifs', () => {
    component.toggleLoadingDemo();
    component.toggleNoDataDemo();

    expect(component.isLoadingDemo).toBeFalse();
    expect(component.showNoDataDemo).toBeTrue();
    expect(component.loadingData).toEqual([]);
  });

  it('retient uniquement les mesures visibles parmi Ventes et Objectif', () => {
    component.onOrganizerChange({
      type: 'fieldToggled',
      state: { visibleFields: ['Ventes', 'Autre'] },
    } as never);

    expect(component.organizerState.selectedFieldIds).toEqual(['Ventes']);
  });

  it('affiche une erreur de rendu texte telle quelle et sérialise les autres erreurs', () => {
    component.onRenderError({ error: 'timeout' } as never);
    expect(component.lastRenderError).toBe('timeout');

    component.onRenderError({ error: { code: 42 } } as never);
    expect(component.lastRenderError).toBe(JSON.stringify({ code: 42 }, null, 2));
  });

  it('réinitialise l’indicateur de copie du code après 1,5 seconde', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    const demo = component.demos[0];

    void component.copyCode(demo);
    tick();

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnceWith(demo.code);
    expect(demo.copied).toBeTrue();

    tick(1500);

    expect(demo.copied).toBeFalse();
  }));
});
