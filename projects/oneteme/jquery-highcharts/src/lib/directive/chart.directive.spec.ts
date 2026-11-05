import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ChartDirective } from './chart.directive';
import { HighchartsInstanceController } from './runtime/highcharts-instance.controller';

const rows = [
  { s: 'S1', c: 'A', v: 1 },
  { s: 'S1', c: 'B', v: 2 },
  { s: 'S2', c: 'A', v: 3 },
];

const baseConfig = (): any => ({
  series: [{ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' } }],
});

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

const chartOf = (dir: ChartDirective<any, any>): any => (dir as any).chart;

const seriesNames = (chart: any): string[] => chart.series.map((s: any) => s.name);

@Component({
  standalone: true,
  imports: [ChartDirective],
  template: `
    <div chart-directive
      style="width: 600px; height: 400px"
      [type]="type"
      [config]="config"
      [data]="data"
      [isLoading]="isLoading"
      [loadingLabel]="loadingLabel"
      [noDataLabel]="noDataLabel"
      [renderedOption]="renderedOption"
      (renderError)="errors.push($event)"></div>
  `,
})
class HostComponent {
  @ViewChild(ChartDirective) dir!: ChartDirective<any, any>;
  type: any = 'line';
  config: any = baseConfig();
  data: any[] = rows;
  isLoading = false;
  loadingLabel = 'Chargement des données...';
  noDataLabel = 'Aucune donnée';
  renderedOption: any = null;
  errors: any[] = [];
}

async function mount(overrides: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  await settle();
  const host = fixture.componentInstance;
  return { fixture, host, dir: host.dir };
}

describe('ChartDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  describe('rendu', () => {
    it('crée un chart Highcharts dans l\'élément hôte', async () => {
      const { fixture, dir } = await mount();
      const chart = chartOf(dir);
      expect(chart).toBeTruthy();
      expect(chart.renderTo).toBe(fixture.nativeElement.querySelector('[chart-directive]'));
    });

    it('rend une série par nom avec les catégories et les valeurs attendues', async () => {
      const { dir } = await mount();
      const chart = chartOf(dir);
      expect(seriesNames(chart)).toEqual(['S1', 'S2']);
      expect(chart.xAxis[0].categories).toEqual(['A', 'B']);
      expect(chart.series[0].yData).toEqual([1, 2]);
    });

    it('expose le rendu courant via getRenderedOption', async () => {
      const { dir } = await mount();
      const option = dir.getRenderedOption() as any;
      expect(option).toBeTruthy();
      expect(option.series.length).toBe(2);
    });
  });

  describe('série et titre', () => {
    it('utilise une valeur constante de name comme nom de série', async () => {
      const config = { series: [{ name: 'Ventes', data: { xField: 'c', yField: 'v' } }] };
      const { dir } = await mount({ config, data: [{ c: 'A', v: 5 }] });
      expect(seriesNames(chartOf(dir))).toEqual(['Ventes']);
    });

    it('affiche config.title comme titre du graphique', async () => {
      const config = { ...baseConfig(), title: 'Mon titre' };
      const { dir } = await mount({ config });
      expect(chartOf(dir).options.title.text).toBe('Mon titre');
    });
  });

  describe('mise à jour des données', () => {
    it('recrée le chart avec les nouvelles séries quand data change', async () => {
      const { fixture, host, dir } = await mount();
      const ancien = chartOf(dir);
      const destroy = spyOn(ancien, 'destroy').and.callThrough();

      host.data = [{ s: 'S3', c: 'A', v: 9 }];
      fixture.detectChanges();
      await settle();

      expect(destroy).toHaveBeenCalled();
      expect(seriesNames(chartOf(dir))).toEqual(['S3']);
    });
  });

  describe('renderedOption', () => {
    it('utilise renderedOption comme rendu et le restitue via getRenderedOption', async () => {
      const renderedOption = {
        xAxis: { type: 'category', categories: ['Z'] },
        yAxis: { type: 'value' },
        series: [
          { type: 'bar', name: 'S1', data: [5] },
          { type: 'bar', name: 'S2', data: [6] },
        ],
      };
      const { dir } = await mount({ renderedOption });

      expect(seriesNames(chartOf(dir))).toEqual(['S1', 'S2']);
      const option = dir.getRenderedOption() as any;
      expect(option).toEqual(renderedOption as any);
      expect(option).not.toBe(renderedOption as any);
    });
  });

  describe('absence de données et chargement', () => {
    it('affiche le libellé Aucune donnée par défaut quand data est vide', async () => {
      const { fixture, dir } = await mount({ data: [] });
      expect(chartOf(dir).series.length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('Aucune donnée');
    });

    it('affiche le libellé noDataLabel personnalisé quand data est vide', async () => {
      const { fixture, dir } = await mount({ data: [], noDataLabel: 'Rien à afficher' });
      expect(chartOf(dir).series.length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('Rien à afficher');
    });

    it('affiche loadingLabel au montage quand isLoading est vrai', async () => {
      const { dir } = await mount({ isLoading: true, loadingLabel: 'Patientez' });
      expect(chartOf(dir).loadingSpan.textContent).toContain('Patientez');
    });

    it('affiche puis masque le chargement lorsque isLoading bascule', async () => {
      const { fixture, host, dir } = await mount({ loadingLabel: 'Patientez' });
      const chart = chartOf(dir);
      const show = spyOn(chart, 'showLoading').and.callThrough();
      const hide = spyOn(chart, 'hideLoading').and.callThrough();

      host.isLoading = true;
      fixture.detectChanges();
      await settle();
      expect(show).toHaveBeenCalledWith('Patientez');

      host.isLoading = false;
      fixture.detectChanges();
      await settle();
      expect(hide).toHaveBeenCalled();
    });
  });

  describe('export et zoom', () => {
    let createdBlob: Blob | null;
    let downloadName: string | null;

    beforeEach(() => {
      createdBlob = null;
      downloadName = null;
      spyOn(URL, 'createObjectURL').and.callFake((blob: Blob) => {
        createdBlob = blob;
        return 'blob:test';
      });
      spyOn(URL, 'revokeObjectURL');
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });
    });

    it('exportData produit un CSV avec BOM et séparateur point-virgule', async () => {
      const { dir } = await mount();
      dir.exportData('fichier');

      expect(downloadName).toBe('fichier.csv');
      expect(createdBlob).toBeTruthy();
      const bytes = new Uint8Array(await createdBlob!.arrayBuffer());
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
      const text = (await createdBlob!.text()).replace('\uFEFF', '');
      expect(text).toContain('S1');
      expect(text).toContain('S2');
      expect(text).toContain(';');
    });

    it('exportImage en svg télécharge un fichier graphe.svg', async () => {
      const { dir } = await mount();
      dir.exportImage('graphe', 'svg');

      expect(downloadName).toBe('graphe.svg');
      expect(createdBlob!.type).toBe('image/svg+xml;charset=utf-8');
    });

    it('exportImage en png appelle exportChartLocal avec un fond blanc', async () => {
      const { dir } = await mount();
      const chart = chartOf(dir);
      const exportLocal = spyOn(chart, 'exportChartLocal');

      dir.exportImage('graphe', 'png');

      expect(exportLocal).toHaveBeenCalledTimes(1);
      const [exportOptions, chartOptions] = exportLocal.calls.mostRecent().args as any[];
      expect(exportOptions).toEqual(jasmine.objectContaining({ type: 'image/png', filename: 'graphe' }));
      expect(chartOptions).toEqual({ chart: { backgroundColor: '#fff' } });
    });

    it('zoomOut délègue au chart courant', async () => {
      const { dir } = await mount();
      const zoomOut = spyOn(chartOf(dir), 'zoomOut');

      dir.zoomOut();

      expect(zoomOut).toHaveBeenCalled();
    });

    it('les méthodes d\'export et de zoom ne lèvent pas sans chart', async () => {
      const { fixture, dir } = await mount();
      fixture.destroy();

      expect(() => dir.exportData()).not.toThrow();
      expect(() => dir.exportImage()).not.toThrow();
      expect(() => dir.zoomOut()).not.toThrow();
      expect(dir.getRenderedOption()).toBeNull();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('cycle de vie', () => {
    it('détruit le chart à la destruction du composant hôte', async () => {
      const { fixture, dir } = await mount();
      const chart = chartOf(dir);
      const destroy = spyOn(chart, 'destroy').and.callThrough();

      fixture.destroy();

      expect(destroy).toHaveBeenCalled();
      expect(chartOf(dir)).toBeNull();
    });

    it('déconnecte le ResizeObserver à la destruction', async () => {
      const disconnect = spyOn(ResizeObserver.prototype, 'disconnect').and.callThrough();
      const { fixture, dir } = await mount();

      fixture.destroy();

      expect(disconnect).toHaveBeenCalled();
      expect((dir as any).resizeObserver).toBeNull();
    });
  });

  describe('erreur de rendu', () => {
    it('émet renderError si la création du chart échoue', async () => {
      const erreur = new Error('boom');
      spyOn(HighchartsInstanceController.prototype, 'create').and.callFake(() => {
        throw erreur;
      });

      const { host, dir } = await mount();

      expect(host.errors.length).toBe(1);
      expect(host.errors[0].error).toBe(erreur);
      expect(chartOf(dir)).toBeNull();
    });
  });
});
