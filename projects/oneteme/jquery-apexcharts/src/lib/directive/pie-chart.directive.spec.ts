import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartProvider } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { PieChartDirective } from './pie-chart.directive';

const DEPENSES = [
  { categorie: 'Loyer', montant: 10 },
  { categorie: 'Transport', montant: 20 },
  { categorie: 'Santé', montant: 15 },
];

const CONFIG: ChartProvider<any, any> = {
  series: [{ name: 'Dépenses', data: { xField: 'categorie', yField: 'montant' } }],
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
  imports: [PieChartDirective],
  template: `<div pie-chart [data]="data" [config]="config" [type]="type"></div>`,
})
class PieHostComponent {
  data: any[] = DEPENSES;
  config: ChartProvider<any, any> = CONFIG;
  type: 'pie' | 'donut' | 'polar' | 'radar' | 'radial' = 'pie';
}

describe('PieChartDirective', () => {
  let fixture: ComponentFixture<PieHostComponent>;
  let host: PieHostComponent;
  let directive: PieChartDirective;
  let element: HTMLElement;

  function internals(): any {
    return directive as any;
  }

  async function render(setup?: (h: PieHostComponent) => void): Promise<void> {
    fixture = TestBed.createComponent(PieHostComponent);
    host = fixture.componentInstance;
    setup?.(host);
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(PieChartDirective));
    directive = debugEl.injector.get(PieChartDirective);
    element = debugEl.nativeElement;
    await waitFor(() => !!element.querySelector('.apexcharts-canvas'));
  }

  async function update(): Promise<void> {
    fixture.detectChanges();
    await settle();
  }

  afterEach(() => fixture?.destroy());

  describe('type "pie"', () => {
    beforeEach(async () => {
      await render();
    });

    it('rend un graphique circulaire', () => {
      expect(element.querySelector('.apexcharts-canvas')).not.toBeNull();
      expect(internals().chartInstance()).toBeInstanceOf(ApexCharts);
      expect(internals()._options.chart.type).toBe('pie');
    });

    it('fournit les valeurs numériques aplaties comme séries', () => {
      expect(internals()._options.series).toEqual([10, 20, 15]);
    });

    it('fournit les libellés issus des catégories', () => {
      expect(internals()._options.labels).toEqual(['Loyer', 'Transport', 'Santé']);
    });
  });

  describe('types spécifiques', () => {
    it('utilise le type donut', async () => {
      await render();
      host.type = 'donut';
      await update();
      await waitFor(() => internals()._options.chart.type === 'donut');

      expect(internals()._options.chart.type).toBe('donut');
    });

    it('traduit le type polar en polarArea', async () => {
      await render();
      host.type = 'polar';
      await update();
      await waitFor(() => internals()._options.chart.type === 'polarArea');

      expect(internals()._options.chart.type).toBe('polarArea');
    });

    it('traduit le type radial en radialBar', async () => {
      await render();
      host.type = 'radial';
      await update();
      await waitFor(() => internals()._options.chart.type === 'radialBar');

      expect(internals()._options.chart.type).toBe('radialBar');
    });
  });

  describe('type "radar"', () => {
    it('utilise le type radar', async () => {
      await render();
      host.type = 'radar';
      await update();
      await waitFor(() => internals()._options.chart.type === 'radar');

      expect(internals()._options.chart.type).toBe('radar');
    });

    it('crée une série « Series 1 » lorsque les données ne contiennent qu’une ligne', async () => {
      await render(h => h.data = [{ categorie: 'Loyer', montant: 10 }]);
      host.type = 'radar';
      await update();
      await waitFor(() => internals()._options.series.length === 1 && internals()._options.series[0].name === 'Series 1');

      expect(internals()._options.series.length).toBe(1);
      expect(internals()._options.series[0]).toEqual(jasmine.objectContaining({ name: 'Series 1', data: [10] }));
    });

    it('conserve les séries nommées lorsqu’il y a plusieurs lignes', async () => {
      await render();
      host.type = 'radar';
      await update();
      await waitFor(() => internals()._options.series.length === 1 && internals()._options.series[0].name === 'Dépenses');

      expect(internals()._options.series[0]).toEqual(jasmine.objectContaining({ name: 'Dépenses', data: [10, 20, 15] }));
    });
  });

  describe('cas limites', () => {
    it('fournit des séries et libellés vides pour un jeu de données vide', async () => {
      await render(h => h.data = []);
      await waitFor(() => internals()._options.labels !== undefined);

      expect(internals()._options.series).toEqual([]);
      expect(internals()._options.labels).toEqual([]);
    });

    it('écarte les valeurs nulles des séries', async () => {
      await render(h => h.data = [
        { categorie: 'Loyer', montant: 10 },
        { categorie: 'Transport', montant: null },
        { categorie: 'Santé', montant: 15 },
      ]);
      await waitFor(() => internals()._options.series.length > 0);

      expect(internals()._options.series).toEqual([10, 15]);
    });

    it('aligne les libellés sur les valeurs conservées lorsqu’une valeur est nulle', async () => {
      await render(h => h.data = [
        { categorie: 'Loyer', montant: 10 },
        { categorie: 'Transport', montant: null },
        { categorie: 'Santé', montant: 15 },
      ]);
      await waitFor(() => internals()._options.series.length > 0);

      expect(internals()._options.labels.length).toBe(internals()._options.series.length);
    });

    it('expose la valeur de isLoading via le getter hérité', async () => {
      await render();

      expect(directive.isLoading).toBeFalse();
    });
  });
});
