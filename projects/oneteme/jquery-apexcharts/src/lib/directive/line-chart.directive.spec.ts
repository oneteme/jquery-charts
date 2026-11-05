import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartProvider } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { LineChartDirective } from './line-chart.directive';

const MOIS_VALEURS = [
  { mois: 'Jan', valeur: 10 },
  { mois: 'Fév', valeur: 20 },
  { mois: 'Mar', valeur: 15 },
];

const CONFIG: ChartProvider<any, any> = {
  series: [{ name: 'Ventes', data: { xField: 'mois', yField: 'valeur' } }],
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
  imports: [LineChartDirective],
  template: `<div line-chart [data]="data" [config]="config" [type]="type" [renderedOption]="renderedOption"></div>`,
})
class LineHostComponent {
  data: any[] = MOIS_VALEURS;
  config: ChartProvider<any, any> = CONFIG;
  type: 'line' | 'area' = 'line';
  renderedOption: unknown = undefined;
}

describe('LineChartDirective', () => {
  let fixture: ComponentFixture<LineHostComponent>;
  let host: LineHostComponent;
  let directive: LineChartDirective<any, any>;
  let element: HTMLElement;

  function internals(): any {
    return directive as any;
  }

  async function render(setup?: (h: LineHostComponent) => void): Promise<void> {
    fixture = TestBed.createComponent(LineHostComponent);
    host = fixture.componentInstance;
    setup?.(host);
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(LineChartDirective));
    directive = debugEl.injector.get(LineChartDirective);
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

    it('rend un graphique en courbe', () => {
      expect(element.querySelector('.apexcharts-canvas')).not.toBeNull();
      expect(internals().chartInstance()).toBeInstanceOf(ApexCharts);
      expect(internals()._options.chart.type).toBe('line');
    });

    it('transmet les valeurs de la série à la configuration', () => {
      const series = internals()._options.series;

      expect(series.length).toBe(1);
      expect(series[0].name).toBe('Ventes');
      expect(series[0].data.map((p: { y: number }) => p.y)).toEqual([10, 20, 15]);
      expect(series[0].data.map((p: { x: string }) => p.x)).toEqual(['Jan', 'Fév', 'Mar']);
    });

    it('associe les abscisses textuelles à un axe de type catégorie', () => {
      expect(internals()._options.xaxis.type).toBe('category');
    });

    it('associe les abscisses de type Date à un axe de type datetime', async () => {
      host.data = [
        { date: new Date(2024, 0, 1), valeur: 1 },
        { date: new Date(2024, 0, 2), valeur: 2 },
      ];
      host.config = { series: [{ name: 'Ventes', data: { xField: 'date', yField: 'valeur' } }] };
      await update();
      await waitFor(() => internals()._options.xaxis.type === 'datetime');

      expect(internals()._options.xaxis.type).toBe('datetime');
    });
  });

  describe('type "area"', () => {
    beforeEach(async () => {
      await render();
    });

    it('bascule en aire et recrée le graphique', async () => {
      const chart = internals().chartInstance();
      host.type = 'area';
      await update();
      await waitFor(() => internals().chartInstance() !== chart && !!internals().chartInstance());

      expect(internals()._options.chart.type).toBe('area');
    });
  });

  describe('sparkline', () => {
    it('masque l’axe Y lorsque le sparkline est activé', async () => {
      await render(h => h.config = {
        ...CONFIG,
        options: { chart: { sparkline: { enabled: true } } },
      });

      expect(internals()._options.yaxis.show).toBeFalse();
      expect(internals()._options.yaxis.labels.show).toBeFalse();
    });

    it('conserve l’axe Y visible sans sparkline', async () => {
      await render();

      expect(internals()._options.yaxis?.show).not.toBeFalse();
    });
  });

  describe('type de l’axe x', () => {
    beforeEach(async () => {
      await render();
    });

    it('privilégie le type d’axe fourni par renderedOption lors de la mise à jour des données', async () => {
      host.renderedOption = { xaxis: { type: 'numeric' } };
      host.data = [...MOIS_VALEURS];
      await update();
      await waitFor(() => internals()._options.xaxis.type === 'numeric');

      expect(internals()._options.xaxis.type).toBe('numeric');
    });

    it('applique l’axe catégoriel lorsque renderedOption fournit des catégories, même avec des abscisses numériques', async () => {
      host.data = [
        { mois: 1, valeur: 10 },
        { mois: 2, valeur: 20 },
      ];
      host.renderedOption = { xaxis: { categories: ['a', 'b'] } };
      await update();
      await waitFor(() => internals()._options.xaxis.type === 'category');

      expect(internals()._options.xaxis.type).toBe('category');
    });

    it('fusionne renderedOption dans les options effectives du rendu', async () => {
      host.renderedOption = { xaxis: { type: 'numeric' } };
      await update();

      expect(internals().getEffectiveOptions().xaxis.type).toBe('numeric');
      expect(internals()._options.xaxis.type).toBe('category');
    });
  });

  describe('cas limites', () => {
    it('gère un jeu de données vide sans erreur', async () => {
      await render();
      host.data = [];
      await update();
      await waitFor(() => internals()._options.series.length === 0);

      expect(internals()._options.series).toEqual([]);
      expect(internals().chartInstance()).toBeInstanceOf(ApexCharts);
    });
  });
});
