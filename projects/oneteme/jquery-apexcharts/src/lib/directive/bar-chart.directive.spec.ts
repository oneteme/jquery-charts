import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartProvider } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { BarChartDirective } from './bar-chart.directive';

const VENTES = [
  { categorie: 'Nord', valeur: 30 },
  { categorie: 'Sud', valeur: 10 },
  { categorie: 'Est', valeur: 20 },
];

const CONFIG: ChartProvider<string, number> = {
  series: [{ name: 'Ventes', data: { xField: 'categorie', yField: 'valeur' } }],
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
  imports: [BarChartDirective],
  template: `<div bar-chart [data]="data" [config]="config" [type]="type"></div>`,
})
class BarHostComponent {
  data: any[] = VENTES;
  config: ChartProvider<any, number> = CONFIG;
  type: 'bar' | 'column' | 'funnel' | 'pyramid' = 'bar';
}

describe('BarChartDirective', () => {
  let fixture: ComponentFixture<BarHostComponent>;
  let host: BarHostComponent;
  let directive: BarChartDirective<any>;
  let element: HTMLElement;

  function internals(): any {
    return directive as any;
  }

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(BarHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(BarChartDirective));
    directive = debugEl.injector.get(BarChartDirective);
    element = debugEl.nativeElement;
    await waitFor(() => !!element.querySelector('.apexcharts-canvas'));
  }

  async function update(): Promise<void> {
    fixture.detectChanges();
    await settle();
  }

  afterEach(() => fixture?.destroy());

  describe('rendu', () => {
    beforeEach(async () => {
      await render();
    });

    it('rend un graphique ApexCharts en barres', () => {
      expect(element.querySelector('.apexcharts-canvas')).not.toBeNull();
      expect(internals().chartInstance()).toBeInstanceOf(ApexCharts);
    });

    it('expose les catégories issues du champ x dans l’ordre des données', () => {
      expect(internals()._options.xaxis.categories).toEqual(['Nord', 'Sud', 'Est']);
    });

    it('déduit un axe x de type catégorie pour des libellés textuels', () => {
      expect(internals()._options.xaxis.type).toBe('category');
    });

    it('mappe la série avec son nom, ses valeurs et son indicateur de masquage', () => {
      expect(internals()._options.series).toEqual([
        jasmine.objectContaining({ name: 'Ventes', data: [30, 10, 20], hidden: false }),
      ]);
    });

    it('marque la série comme masquée lorsque visible vaut false', async () => {
      host.config = {
        series: [{ name: 'Ventes', data: { xField: 'categorie', yField: 'valeur' }, visible: false }],
      };
      await update();

      expect(internals()._options.series[0].hidden).toBeTrue();
    });
  });

  describe('type "bar" (barres horizontales)', () => {
    beforeEach(async () => {
      await render();
    });

    it('utilise le type de graphique bar avec des barres horizontales', () => {
      expect(internals()._options.chart.type).toBe('bar');
      expect(internals()._options.plotOptions.bar.horizontal).toBeTrue();
      expect(internals()._options.plotOptions.bar.isFunnel).toBeFalse();
    });

    it('conserve l’ordre des données sans tri', () => {
      expect(internals()._options.xaxis.categories).toEqual(['Nord', 'Sud', 'Est']);
    });
  });

  describe('type "column" (barres verticales)', () => {
    beforeEach(async () => {
      await render();
      host.type = 'column';
      await update();
      await waitFor(() => internals()._options.plotOptions.bar.horizontal === false);
    });

    it('désactive l’orientation horizontale', () => {
      expect(internals()._options.plotOptions.bar.horizontal).toBeFalse();
      expect(internals()._options.plotOptions.bar.isFunnel).toBeFalse();
    });

    it('revient aux barres horizontales lorsque le type repasse à bar', async () => {
      host.type = 'bar';
      await update();
      await waitFor(() => internals()._options.plotOptions.bar.horizontal === true);

      expect(internals()._options.plotOptions.bar.horizontal).toBeTrue();
    });
  });

  describe('type "funnel" (entonnoir)', () => {
    beforeEach(async () => {
      await render();
      host.type = 'funnel';
      await update();
      await waitFor(() => internals()._options.plotOptions.bar.isFunnel === true);
    });

    it('active isFunnel et les barres horizontales', () => {
      expect(internals()._options.plotOptions.bar.isFunnel).toBeTrue();
      expect(internals()._options.plotOptions.bar.horizontal).toBeTrue();
    });

    it('trie les données par valeur croissante', () => {
      expect(internals()._options.xaxis.categories).toEqual(['Sud', 'Est', 'Nord']);
      expect(internals()._options.series[0].data).toEqual([10, 20, 30]);
    });
  });

  describe('type "pyramid" (pyramide)', () => {
    beforeEach(async () => {
      await render();
      host.type = 'pyramid';
      await update();
      await waitFor(() => internals()._options.plotOptions.bar.isFunnel === true);
    });

    it('active isFunnel et les barres horizontales', () => {
      expect(internals()._options.plotOptions.bar.isFunnel).toBeTrue();
      expect(internals()._options.plotOptions.bar.horizontal).toBeTrue();
    });

    it('trie les données par valeur décroissante', () => {
      expect(internals()._options.xaxis.categories).toEqual(['Nord', 'Est', 'Sud']);
      expect(internals()._options.series[0].data).toEqual([30, 20, 10]);
    });
  });

  describe('cas limites', () => {
    it('fournit une série vide lorsque la configuration ne déclare aucune série', async () => {
      await render();
      host.config = {};
      host.data = [];
      await update();
      await waitFor(() => internals()._options.series.length === 1 && internals()._options.series[0].data.length === 0);

      expect(internals()._options.series).toEqual([jasmine.objectContaining({ data: [] })]);
      expect(internals()._options.series[0].name).toBeUndefined();
      expect(internals()._options.xaxis.categories).toEqual([]);
    });

    it('remplace la série déclarée par une série sans nom lorsque les données sont vides', async () => {
      await render();
      host.data = [];
      await update();
      await waitFor(() => internals()._options.series.length === 1 && internals()._options.series[0].data.length === 0);

      expect(internals()._options.series[0].name).toBeUndefined();
      expect(internals()._options.series[0].data).toEqual([]);
    });
  });
});
