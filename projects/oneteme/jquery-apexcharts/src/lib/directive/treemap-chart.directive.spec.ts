import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartProvider } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { TreemapChartDirective } from './treemap-chart.directive';

const PARTS = [
  { produit: 'Alpha', poids: 40 },
  { produit: 'Beta', poids: 25 },
];

const CONFIG: ChartProvider<any, any> = {
  series: [{ name: 'Parts', data: { xField: 'produit', yField: 'poids' } }],
};

function settle(ms = 30): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(condition: () => boolean, timeout = 3000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Délai dépassé en attendant la condition.');
    }
    await settle(20);
  }
}

@Component({
  standalone: true,
  imports: [TreemapChartDirective],
  template: `<div treemap-chart [data]="data" [config]="config" [type]="type"></div>`,
})
class TreemapHostComponent {
  data: any[] = PARTS;
  config: ChartProvider<any, any> = CONFIG;
  type: 'treemap' | 'heatmap' = 'treemap';
}

describe('TreemapChartDirective', () => {
  let fixture: ComponentFixture<TreemapHostComponent>;
  let host: TreemapHostComponent;
  let directive: TreemapChartDirective;
  let element: HTMLElement;

  function internals(): any {
    return directive as any;
  }

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(TreemapHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(TreemapChartDirective));
    directive = debugEl.injector.get(TreemapChartDirective);
    element = debugEl.nativeElement;
    await waitFor(() => !!element.querySelector('.apexcharts-canvas'));
  }

  async function update(): Promise<void> {
    fixture.detectChanges();
    await settle();
  }

  afterEach(() => fixture?.destroy());

  describe('type "treemap"', () => {
    beforeEach(async () => {
      await render();
    });

    it('rend un graphique treemap', () => {
      expect(element.querySelector('.apexcharts-canvas')).not.toBeNull();
      expect(internals().chartInstance()).toBeInstanceOf(ApexCharts);
      expect(internals()._options.chart.type).toBe('treemap');
    });

    it('fournit des points {x, y} comme données de série', () => {
      const serie = internals()._options.series[0];
      expect(serie.name).toBe('Parts');
      expect(serie.data.map((p: { x: string; y: number }) => ({ x: p.x, y: p.y })))
        .toEqual([{ x: 'Alpha', y: 40 }, { x: 'Beta', y: 25 }]);
    });
  });

  describe('type "heatmap"', () => {
    it('bascule vers heatmap et recrée le graphique', async () => {
      await render();
      const chart = internals().chartInstance();
      host.type = 'heatmap';
      await update();
      await waitFor(() => internals().chartInstance() !== chart && !!internals().chartInstance());

      expect(internals()._options.chart.type).toBe('heatmap');
    });
  });

  describe('cas limites', () => {
    it('gère un jeu de données vide sans erreur', async () => {
      await render();
      host.data = [];
      await update();
      await waitFor(() => internals()._options.series.every((s: { data: unknown[] }) => s.data.length === 0));

      expect(internals()._options.series.every((s: { data: unknown[] }) => s.data.length === 0)).toBeTrue();
    });
  });
});
