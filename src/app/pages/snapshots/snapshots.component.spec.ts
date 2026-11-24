import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DuplicateVisualSnapshotLabelError, VISUAL_SNAPSHOT_STORAGE_KEY, VisualSnapshot } from '@oneteme/jquery-core';
import { ChartClickEvent, ChartComponent } from '@oneteme/jquery-echarts';
import { SnapshotsComponent } from './snapshots.component';

describe('SnapshotsComponent', () => {
  let component: SnapshotsComponent;

  beforeEach(() => {
    localStorage.removeItem(VISUAL_SNAPSHOT_STORAGE_KEY);
    TestBed.configureTestingModule({ imports: [SnapshotsComponent] });
    component = TestBed.createComponent(SnapshotsComponent).componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem(VISUAL_SNAPSHOT_STORAGE_KEY);
  });

  describe('copie de snapshot', () => {
    it('enregistre le graphique avec le nom saisi sans espaces superflus puis ferme la modale', () => {
      const chart = jasmine.createSpyObj<ChartComponent<any, any>>('chart', ['copyVisualSnapshot']);
      component.demoChart = chart;
      component.openCopyModal('chart');
      component.copyTitle = '  Ventes Q1  ';

      component.confirmCopy();

      expect(chart.copyVisualSnapshot).toHaveBeenCalledOnceWith('Ventes Q1');
      expect(component.activeCopyTarget).toBeNull();
    });

    it('n’enregistre rien si le nom est vide', () => {
      const chart = jasmine.createSpyObj<ChartComponent<any, any>>('chart', ['copyVisualSnapshot']);
      component.demoChart = chart;
      component.openCopyModal('chart');
      component.copyTitle = '   ';

      component.confirmCopy();

      expect(chart.copyVisualSnapshot).not.toHaveBeenCalled();
      expect(component.activeCopyTarget).toBe('chart');
    });

    it('garde la modale ouverte avec un message explicite lorsque le nom existe déjà', () => {
      const table = jasmine.createSpyObj<any>('table', ['copyVisualSnapshot']);
      table.copyVisualSnapshot.and.throwError(new DuplicateVisualSnapshotLabelError('Tableau'));
      component.demoTable = table;
      component.openCopyModal('table');

      component.confirmCopy();

      expect(component.copyError).toBe('Ce nom est déjà utilisé.');
      expect(component.activeCopyTarget).toBe('table');
    });
  });

  describe('drilldown', () => {
    it('charge le détail des jours après le délai de récupération du mois cliqué', fakeAsync(() => {
      component.onDrilldownClick({ name: 'Mars', dataIndex: 2 } as ChartClickEvent);
      expect(component.drilldownLoading).toBeTrue();

      tick(2000);

      expect(component.drilldownLoading).toBeFalse();
      expect(component.drilldownConfig.activeLevel).toBe('days');
      expect(component.selectedDrilldownMonth).toBe('Mars');
      expect(component.drilldownRows.length).toBe(28);
    }));

    it('descend jusqu’aux heures depuis un jour sélectionné', fakeAsync(() => {
      component.onDrilldownClick({ name: 'Mars', dataIndex: 2 } as ChartClickEvent);
      tick(2000);

      component.onDrilldownClick({ name: '03', dataIndex: 2 } as ChartClickEvent);
      tick(900);

      expect(component.drilldownConfig.activeLevel).toBe('hours');
      expect(component.selectedDrilldownDay).toBe('03');
      expect(component.drilldownRows.length).toBe(24);
    }));

    it('ignore la réponse d’un mois si l’utilisateur a navigué entre-temps', fakeAsync(() => {
      component.onDrilldownClick({ name: 'Mars', dataIndex: 2 } as ChartClickEvent);
      component.onDrilldownNavigate('months');

      tick(2000);

      expect(component.drilldownConfig.activeLevel).toBe('months');
      expect(component.drilldownRows).toBe(component.rows);
      expect(component.drilldownLoading).toBeFalse();
    }));
  });

  describe('tableau de bord', () => {
    it('ajoute une tuile par snapshot et ne retire que la tuile demandée', () => {
      const sales = { id: 'snap-1', type: 'chart', label: 'Ventes', config: {} } as unknown as VisualSnapshot;
      const orders = { id: 'snap-2', type: 'chart', label: 'Commandes', config: {} } as unknown as VisualSnapshot;

      component.addSnapshot(sales);
      component.addSnapshot(orders);
      const salesSlot = component.dashboardSlots[0];
      component.removeSlot(salesSlot.id);

      expect(component.dashboardSlots.map(slot => slot.snapshot)).toEqual([orders]);
    });
  });
});
