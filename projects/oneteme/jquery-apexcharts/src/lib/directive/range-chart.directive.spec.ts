import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartProvider } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { RangeChartDirective } from './range-chart.directive';

const PLAGES = [
  { mois: 'Jan', plage: [5, 10] },
  { mois: 'Fév', plage: [7, 12] },
];

const CONFIG: ChartProvider<any, any> = {
  series: [{ name: 'Température', data: { xField: 'mois', yField: 'plage' } }],
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
  imports: [RangeChartDirective],
  template: `<div range-chart [data]="data" [config]="config" [type]="type"></div>`,
})
class RangeHostComponent {
  data: any[] = PLAGES;
  config: ChartProvider<any, any> = CONFIG;
  type: 'rangeArea' | 'rangeBar' | 'rangeColumn' = 'rangeArea';
}

describe('RangeChartDirective', () => {
  let fixture: ComponentFixture<RangeHostComponent>;
  let host: RangeHostComponent;
  let directive: RangeChartDirective<any>;
  let element: HTMLElement;

  function internals(): any {
    return directive as any;
  }

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(RangeHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(RangeChartDirective));
    directive = debugEl.injector.get(RangeChartDirective);
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

    it('rend un graphique en plage (rangeArea) par défaut', () => {
      expect(element.querySelector('.apexcharts-canvas')).not.toBeNull();
      expect(internals().chartInstance()).toBeInstanceOf(ApexCharts);
      expect(internals()._options.chart.type).toBe('rangeArea');
    });

    it('conserve les paires [min, max] comme valeurs de série', () => {
      expect(internals()._options.series.length).toBe(1);
      expect(internals()._options.series[0].name).toBe('Température');
      expect(internals()._options.series[0].data.map((p: { y: number[] }) => p.y)).toEqual([[5, 10], [7, 12]]);
    });

    it('n’oriente pas la plage en horizontal', () => {
      expect(internals()._options.plotOptions.bar.horizontal).toBeFalse();
    });

    it('masque la série lorsque visible vaut false', async () => {
      host.config = {
        series: [{ name: 'Température', data: { xField: 'mois', yField: 'plage' }, visible: false }],
      };
      await update();
      await waitFor(() => internals()._options.series[0]?.hidden === true);

      expect(internals()._options.series[0].hidden).toBeTrue();
    });
  });

  describe('types de plage', () => {
    beforeEach(async () => {
      await render();
    });

    it('utilise rangeBar en horizontal', async () => {
      host.type = 'rangeBar';
      await update();
      await waitFor(() => internals()._options.chart.type === 'rangeBar');

      expect(internals()._options.chart.type).toBe('rangeBar');
      expect(internals()._options.plotOptions.bar.horizontal).toBeTrue();
    });

    it('traduit rangeColumn en rangeBar vertical', async () => {
      host.type = 'rangeColumn';
      await update();
      await waitFor(() => internals()._options.plotOptions.bar.horizontal === false
        && internals()._options.chart.type === 'rangeBar');

      expect(internals()._options.chart.type).toBe('rangeBar');
      expect(internals()._options.plotOptions.bar.horizontal).toBeFalse();
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
