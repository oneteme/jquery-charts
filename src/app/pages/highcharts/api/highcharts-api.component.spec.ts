import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChartDrilldownRequest, VisualSnapshotDraft } from '@oneteme/jquery-core';
import { OrganizerButtonEvent } from '@oneteme/jquery-organizer';
import { HighchartsApiComponent } from './highcharts-api.component';

type ExportChart = NonNullable<HighchartsApiComponent['exportChart']>;

describe('HighchartsApiComponent', () => {
  let component: HighchartsApiComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HighchartsApiComponent], providers: [provideRouter([])] });
    component = TestBed.createComponent(HighchartsApiComponent).componentInstance;
  });

  describe('organizer', () => {
    it('applique le type de graphique choisi et ne garde que les séries visibles', () => {
      component.onOrganizerChange({
        state: { visibleFields: ['Objectif'], selectedChartType: 'column' },
      } as OrganizerButtonEvent);

      expect(component.organizerChartType).toBe('column');
      expect(component.organizerState.selectedFieldIds).toEqual(['Objectif']);
      expect(component.organizerMenuState.selectedChartType).toBe('column');
    });

    it('conserve le type de graphique courant quand l’événement n’en précise pas', () => {
      component.organizerChartType = 'area';

      component.onOrganizerChange({
        state: { visibleFields: ['Ventes', 'Objectif'] },
      } as OrganizerButtonEvent);

      expect(component.organizerChartType).toBe('area');
      expect(component.organizerState.selectedFieldIds).toEqual(['Ventes', 'Objectif']);
    });
  });

  describe('drilldown', () => {
    it('ignore une demande dont la valeur n’est ni texte ni nombre', () => {
      const before = component.drilldownData;

      component.onDrilldownRequest({ toLevel: 'site', value: null } as unknown as ChartDrilldownRequest);

      expect(component.drilldownData).toBe(before);
      expect(component.drilldown.activeLevel).toBe('region');
    });

    it('bascule la configuration active vers le niveau site après drilldown', () => {
      component.onDrilldownRequest({ toLevel: 'site', value: 'Sud' } as ChartDrilldownRequest);

      expect(component.activeDrilldownConfig.title).toBe('Sites');
      expect(component.drilldownData.map(row => row.site)).toEqual(['Toulouse', 'Montpellier']);
    });

    it('rétablit la configuration région et toutes les lignes à la remontée', () => {
      component.onDrilldownRequest({ toLevel: 'site', value: 'Sud' } as ChartDrilldownRequest);

      component.onDrilldownNavigate('region');

      expect(component.activeDrilldownConfig.title).toBe('Régions');
      expect(component.drilldownData.length).toBe(4);
    });
  });

  describe('chargement', () => {
    it('affiche des données vides quand la démo « sans données » est active', () => {
      expect(component.loadingData.length).toBe(component.baseData.length);

      component.showNoDataDemo = true;

      expect(component.loadingData).toEqual([]);
    });
  });

  describe('actions d’export', () => {
    it('délègue export image, export données et plein écran au graphique exporté', () => {
      const chart = jasmine.createSpyObj<ExportChart>('ExportChart', ['exportImage', 'exportData', 'toggleFullscreen']);
      component.exportChart = chart;

      component.exportVisual();
      component.exportData();
      component.toggleExportFullscreen();

      expect(chart.exportImage).toHaveBeenCalledOnceWith('highcharts-api', 'png', 2);
      expect(chart.exportData).toHaveBeenCalledOnceWith('highcharts-api', ';');
      expect(chart.toggleFullscreen).toHaveBeenCalledTimes(1);
    });

    it('prépare le draft et persiste le snapshot du graphique exporté', () => {
      const draft = { type: 'chart', label: 'API Highcharts', config: {}, state: {}, data: [], warnings: [] } as VisualSnapshotDraft;
      const chart = jasmine.createSpyObj<ExportChart>('ExportChart', ['createVisualSnapshot', 'copyVisualSnapshot']);
      chart.createVisualSnapshot.and.returnValue(draft);
      component.exportChart = chart;

      component.copyExportSnapshot();

      expect(component.snapshotDraft).toBe(draft);
      expect(chart.copyVisualSnapshot).toHaveBeenCalledOnceWith('API Highcharts');
    });

    it('ne fait rien quand le graphique exporté n’est pas encore rendu', () => {
      component.copyExportSnapshot();

      expect(component.snapshotDraft).toBeNull();
    });
  });
});
