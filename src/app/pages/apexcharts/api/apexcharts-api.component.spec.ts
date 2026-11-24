import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChartDrilldownRequest } from '@oneteme/jquery-core';
import { OrganizerButtonEvent } from '@oneteme/jquery-organizer';
import { ApexChartsApiComponent } from './apexcharts-api.component';

type CompleteChart = NonNullable<ApexChartsApiComponent['completeOrganizerChart']>;

describe('ApexChartsApiComponent', () => {
  let component: ApexChartsApiComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ApexChartsApiComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(ApexChartsApiComponent).componentInstance;
  });

  describe('familles de graphiques', () => {
    it('met à jour le type courant de la famille choisie', () => {
      const demo = component.familyDemos[0];

      component.setFamilyType(demo, 'area');

      expect(demo.currentType).toBe('area');
    });
  });

  describe('état de chargement', () => {
    it('n’expose les données de la barre d’outils qu’à l’état prêt', () => {
      component.setState('loading');
      expect(component.isLoadingDemo).toBeTrue();
      expect(component.stateData).toEqual([]);

      component.setState('empty');
      expect(component.isLoadingDemo).toBeFalse();
      expect(component.isEmptyDemo).toBeTrue();
      expect(component.stateData).toEqual([]);

      component.setState('ready');
      expect(component.stateData).toBe(component.toolbarData);
    });
  });

  describe('organizer simple', () => {
    it('ordonne les séries visibles selon leur déclaration et non selon l’ordre de l’événement', () => {
      component.onOrganizerChange({
        state: { visibleFields: ['Objectif', 'Ventes'] },
      } as OrganizerButtonEvent);

      expect(component.organizerState.selectedFieldIds).toEqual(['Ventes', 'Objectif']);
    });

    it('retire une série masquée et conserve le regroupement courant', () => {
      component.organizerState = { ...component.organizerState, groupByKey: 'region' };

      component.onOrganizerChange({
        state: { visibleFields: ['Ventes'] },
      } as OrganizerButtonEvent);

      expect(component.organizerState.selectedFieldIds).toEqual(['Ventes']);
      expect(component.organizerState.groupByKey).toBe('region');
    });
  });

  describe('organizer complet', () => {
    it('agrège la somme du chiffre d’affaires par mois par défaut', () => {
      expect(component.completeOrganizerChartData.map(row => row['value_total'])).toEqual([304, 381, 451, 503]);
    });

    it('produit une colonne par valeur de regroupement', () => {
      component.onCompleteOrganizerChange({
        type: 'groupBySelected',
        state: { selectedY: 'orders', selectedYAggregate: 'sum', selectedGroupBy: 'region' },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerTableColumns.map(column => column.name)).toEqual(['Nord', 'Sud', 'Est']);
      expect(component.completeOrganizerChartData[0]).toEqual({ label: 'Jan', value_nord: 18, value_sud: 15, value_est: 13 });
      expect(component.completeOrganizerChartConfig.subtitle).toBe('Mois · Région');
    });

    it('compte les lignes lorsque l’agrégat est Nombre', () => {
      component.onCompleteOrganizerChange({
        type: 'ySelected',
        state: { selectedYAggregate: 'count' },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerChartData.map(row => row['value_total'])).toEqual([3, 3, 3, 3]);
    });

    it('applique les tranches sélectionnées avant l’agrégation', () => {
      component.onCompleteOrganizerChange({
        type: 'sliceSelected',
        state: { selectedSlices: ['region-nord', 'region-sud'] },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerChartData[0]['value_total']).toBe(218);
      expect(component.completeOrganizerState.dynamicSliceKeys).toEqual(['region-nord', 'region-sud']);
    });

    it('calcule les bornes min et max uniquement pour les types de plage', () => {
      component.onCompleteOrganizerChange({
        type: 'chartTypeSelected',
        state: { selectedChartType: 'rangeColumn' },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerChartType).toBe('rangeColumn');
      expect(component.completeOrganizerChartData[0]['value_total_min']).toBe(86);
      expect(component.completeOrganizerChartData[0]['value_total_max']).toBe(120);

      component.onCompleteOrganizerChange({
        type: 'chartTypeSelected',
        state: { selectedChartType: 'column' },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerChartData[0]['value_total_min']).toBeUndefined();
    });

    it('restreint les séries aux champs visibles en conservant l’ordre des séries', () => {
      component.onCompleteOrganizerChange({
        type: 'groupBySelected',
        state: { selectedGroupBy: 'region', visibleFields: ['Sud', 'Nord'] },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerState.selectedFieldIds).toEqual(['Nord', 'Sud']);
      expect(component.completeOrganizerState.groupByKey).toBe('region');
    });

    it('compose le titre avec la mesure et l’agrégat choisis', () => {
      expect(component.completeOrganizerChartConfig.title).toBe('Chiffre d’affaires · Somme');

      component.onCompleteOrganizerChange({
        type: 'ySelected',
        state: { selectedY: 'orders', selectedYAggregate: 'average' },
      } as OrganizerButtonEvent);

      expect(component.completeOrganizerChartConfig.title).toBe('Commandes · Moyenne');
    });

    it('résume les filtres actifs dans le libellé dédié', () => {
      expect(component.getCompleteOrganizerSlicesLabel()).toBe('Aucun filtre');

      component.onCompleteOrganizerChange({
        type: 'sliceSelected',
        state: { selectedSlices: ['region-nord', 'channel-online'] },
      } as OrganizerButtonEvent);

      expect(component.getCompleteOrganizerSlicesLabel()).toBe('Région Nord, Canal en ligne');
    });

    it('retourne « Aucun » sans identifiant et l’identifiant brut si le libellé est inconnu', () => {
      expect(component.getCompleteOrganizerLabel('x')).toBe('Aucun');
      expect(component.getCompleteOrganizerLabel('x', 'inconnu')).toBe('inconnu');
      expect(component.getCompleteOrganizerLabel('y', 'orders')).toBe('Commandes');
    });

    it('bascule vers la vue tableau en synchronisant la configuration', () => {
      component.switchCompleteOrganizerView('table');

      expect(component.completeOrganizerViewMode).toBe('table');
      expect(component.completeOrganizerMenuState.viewMode).toBe('table');
      expect(component.completeOrganizerConfig.switchView?.currentView).toBe('table');
      expect(component.completeOrganizerActionStatus).toBe('Vue tableau activée');
    });

    it('enregistre puis réinitialise les préférences', () => {
      component.saveCompleteOrganizerPreferences();
      expect(component.completeOrganizerConfig.hasSavedPreferences).toBeTrue();

      component.clearCompleteOrganizerPreferences();
      expect(component.completeOrganizerConfig.hasSavedPreferences).toBeFalse();
    });

    it('signale que le graphique est en préparation lorsqu’il n’est pas encore rendu', () => {
      component.exportCompleteOrganizerVisual();

      expect(component.completeOrganizerActionStatus).toBe('Le graphique est encore en préparation');
    });

    it('délègue les exports image et données au graphique complet rendu', () => {
      const chart = jasmine.createSpyObj<CompleteChart>('CompleteChart', ['exportImage', 'exportData']);
      component.completeOrganizerChart = chart;

      component.exportCompleteOrganizerVisual();
      expect(chart.exportImage).toHaveBeenCalledOnceWith('apexcharts-organizer-complet', 'png', 2);

      component.exportCompleteOrganizerData();
      expect(chart.exportData).toHaveBeenCalledOnceWith('apexcharts-organizer-complet', ';');
      expect(component.completeOrganizerActionStatus).toBe('Export des données lancé');
    });
  });

  describe('drilldown', () => {
    it('ignore une demande qui ne cible pas le niveau site', () => {
      const before = component.drilldownData;

      component.onDrilldownRequest({ toLevel: 'region', value: 'Nord' } as ChartDrilldownRequest);

      expect(component.drilldownData).toBe(before);
      expect(component.drilldown.activeLevel).toBe('region');
    });

    it('affiche uniquement les sites de la région cliquée', () => {
      component.onDrilldownRequest({ toLevel: 'site', value: 'Nord' } as ChartDrilldownRequest);

      expect(component.drilldownData.map(row => row.site)).toEqual(['Lille', 'Arras']);
      expect(component.activeDrilldownConfig.title).toBe('Sites');
    });

    it('remonte aux totaux régionaux lors de la navigation vers la région', () => {
      component.onDrilldownRequest({ toLevel: 'site', value: 'Nord' } as ChartDrilldownRequest);

      component.onDrilldownNavigate('region');

      expect(component.drilldownData).toEqual([
        { region: 'Nord', site: '', value: 73 },
        { region: 'Sud', site: '', value: 63 },
      ]);
      expect(component.activeDrilldownConfig.title).toBe('Régions');
      expect(component.drilldown.activeLevel).toBe('region');
    });
  });
});
