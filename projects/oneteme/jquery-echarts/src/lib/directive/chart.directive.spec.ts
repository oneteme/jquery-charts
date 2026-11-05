import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ChartDirective } from './chart.directive';

const rows = [
  { s: 'S1', c: 'A', v: 1 },
  { s: 'S1', c: 'B', v: 2 },
  { s: 'S2', c: 'A', v: 3 },
];

const baseConfig = (): any => ({
  series: [{ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' } }],
});

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

@Component({
  standalone: true,
  imports: [ChartDirective],
  template: `
    <div echarts-chart
      style="width: 400px; height: 300px"
      [type]="type"
      [config]="config"
      [data]="data"
      [isLoading]="isLoading"
      [renderedOption]="renderedOption"
      [group]="group"
      [noDataLabel]="noDataLabel"></div>
  `,
})
class HostComponent {
  @ViewChild(ChartDirective) dir!: ChartDirective<any, any>;
  type: any = 'line';
  config: any = baseConfig();
  data: any[] = rows;
  isLoading = false;
  renderedOption: any = null;
  group: string | null = null;
  noDataLabel = 'Aucune donnée';
}

async function mount(overrides: Partial<HostComponent> = {}) {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  await settle();
  const host = fixture.componentInstance;
  return { fixture, host, dir: host.dir, chart: (host.dir as any)._chartInstance };
}

describe('ChartDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  describe('rendu', () => {
    it('initialise ECharts et rend une série par nom', async () => {
      const { chart } = await mount();
      expect(chart).toBeTruthy();
      expect(chart.getOption().series.map((s: any) => s.name)).toEqual(['S1', 'S2']);
    });

    it('expose le rendu courant via getRenderedOption', async () => {
      const { dir } = await mount();
      const option = dir.getRenderedOption() as any;
      expect(option).toBeTruthy();
      expect(option.series.length).toBe(2);
    });

    it('utilise replaceMerge lors d\'une mise à jour des données', async () => {
      const { fixture, host, chart } = await mount();
      const spy = spyOn(chart, 'setOption').and.callThrough();
      host.data = rows.slice(0, 2);
      fixture.detectChanges();
      await settle();
      expect(spy).toHaveBeenCalled();
      const [, opts] = spy.calls.mostRecent().args as any[];
      expect(opts.notMerge).toBeFalse();
      expect(opts.replaceMerge).toEqual(jasmine.arrayContaining(['series', 'xAxis', 'yAxis']));
    });

    it('repart en notMerge lors d\'un changement de type', async () => {
      const { fixture, host, chart } = await mount();
      const spy = spyOn(chart, 'setOption').and.callThrough();
      host.type = 'bar';
      fixture.detectChanges();
      await settle();
      expect(spy).toHaveBeenCalled();
      const [, opts] = spy.calls.mostRecent().args as any[];
      expect(opts.notMerge).toBeTrue();
      expect(chart.getOption().series[0].type).toBe('bar');
    });

    it('remplace le rendu par renderedOption et applique la visibilité des séries', async () => {
      const config = baseConfig();
      config.series.push({ name: (o: any) => o.s, data: { xField: 'c', yField: 'v' }, visible: false });
      const renderedOption = {
        xAxis: { type: 'category', data: ['Z'] },
        yAxis: { type: 'value' },
        series: [
          { type: 'bar', name: 'S1', data: [5] },
          { type: 'bar', name: 'S2', data: [6] },
        ],
      };
      const { dir, chart } = await mount({ config, renderedOption });
      const option = dir.getRenderedOption() as any;
      expect(option.series.map((s: any) => s.name)).toEqual(['S1', 'S2']);
      expect(chart.getOption().legend[0].selected.S2).toBeFalse();
    });
  });

  describe('absence de données et chargement', () => {
    it('affiche le message sans données et vide les séries', async () => {
      const { chart } = await mount({ data: [] });
      expect(chart.getOption().series).toEqual([]);
      expect(JSON.stringify(chart.getOption().graphic)).toContain('Aucune donnée');
    });

    it('utilise le libellé noDataLabel personnalisé', async () => {
      const { chart } = await mount({ data: [], noDataLabel: 'Rien à afficher' });
      expect(JSON.stringify(chart.getOption().graphic)).toContain('Rien à afficher');
    });

    it('affiche puis masque le chargement avec isLoading', async () => {
      const { fixture, host, chart } = await mount();
      const show = spyOn(chart, 'showLoading').and.callThrough();
      const hide = spyOn(chart, 'hideLoading').and.callThrough();

      host.isLoading = true;
      fixture.detectChanges();
      await settle();
      expect(show).toHaveBeenCalled();

      host.isLoading = false;
      fixture.detectChanges();
      await settle();
      expect(hide).toHaveBeenCalled();
    });
  });

  describe('export', () => {
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

    it('exportData produit un CSV avec séparateur, BOM et échappement', async () => {
      const data = [{ name: 'a;b', value: 'x"y' }];
      const { dir } = await mount({ data });
      dir.exportData('fichier');

      expect(downloadName).toBe('fichier.csv');
      expect(createdBlob).toBeTruthy();
      const bytes = new Uint8Array(await createdBlob!.arrayBuffer());
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
      const text = (await createdBlob!.text()).replace('\uFEFF', '');
      expect(text).toBe('name;value\n"a;b";"x""y"');
    });

    it('exportData ne fait rien sans données', async () => {
      const { dir } = await mount({ data: [] });
      dir.exportData();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('exportImage en svg passe par getDataURL avec fond blanc', async () => {
      const { dir, chart } = await mount();
      const getDataURL = spyOn(chart, 'getDataURL').and.returnValue('data:image/svg+xml;base64,AAAA');
      dir.exportImage('graphe', 'svg');

      expect(getDataURL).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'svg', backgroundColor: '#fff' }));
      expect(downloadName).toBe('graphe.svg');
    });
  });

  describe('synchronisation du zoom', () => {
    it('propage un zoom aux graphiques du même groupe', async () => {
      const a = await mount({ group: 'g-zoom' });
      const b = await mount({ group: 'g-zoom' });
      const spyB = spyOn(b.chart, 'dispatchAction').and.callThrough();

      a.chart.dispatchAction({ type: 'dataZoom', dataZoomIndex: 0, start: 10, end: 50 });
      await settle();

      expect(spyB).toHaveBeenCalledWith(jasmine.objectContaining({
        type: 'dataZoom',
        dataZoomIndex: 0,
        start: 10,
        end: 50,
      }));
    });
  });

  describe('cycle de vie', () => {
    it('libère l\'instance ECharts à la destruction', async () => {
      const { fixture, chart } = await mount();
      fixture.destroy();
      expect(chart.isDisposed()).toBeTrue();
    });
  });
});
