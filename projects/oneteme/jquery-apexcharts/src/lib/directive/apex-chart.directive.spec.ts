import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChartProvider } from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { LineChartDirective } from './line-chart.directive';

const SAMPLE_DATA = [
  { mois: 'Jan', valeur: 10 },
  { mois: 'Fév', valeur: 20 },
  { mois: 'Mar', valeur: 15 },
];

const SAMPLE_CONFIG: ChartProvider<any, any> = {
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
  template: `
    <div line-chart
      [data]="data"
      [config]="config"
      [type]="type"
      [renderedOption]="renderedOption"
      [isLoading]="isLoading"
      [loadingLabel]="loadingLabel"
      [noDataLabel]="noDataLabel"
      [canPivot]="canPivot"
      [theme]="theme"
      [group]="group"
      [groupSync]="groupSync"
      (customEvent)="events.push($event)"
      (renderError)="errors.push($event)">
    </div>
  `,
})
class HostComponent {
  data: any[] = SAMPLE_DATA;
  config: ChartProvider<any, any> = SAMPLE_CONFIG;
  type: 'line' | 'area' = 'line';
  renderedOption: unknown = undefined;
  isLoading = false;
  loadingLabel: string = undefined as any;
  noDataLabel: string = undefined as any;
  canPivot: any = false;
  theme: Record<string, unknown> | null = null;
  group: string | null = null;
  groupSync: any = null;
  events: any[] = [];
  errors: any[] = [];
}

describe('ApexChartDirectiveBase', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let directive: LineChartDirective<any, any>;
  let element: HTMLElement;

  function internals(): any {
    return directive as any;
  }

  function currentChart(): ApexCharts | null {
    return internals().chartInstance();
  }

  async function createFixture(): Promise<void> {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    directive = fixture.debugElement.query(By.directive(LineChartDirective)).injector.get(LineChartDirective);
    element = fixture.debugElement.query(By.directive(LineChartDirective)).nativeElement;
    await waitFor(() => !!currentChart());
    await waitFor(() => !!element.querySelector('.apexcharts-canvas'));
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('initialisation et rendu', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('rend un graphique ApexCharts dans l’élément hôte', () => {
      expect(element.querySelector('.apexcharts-canvas')).not.toBeNull();
    });

    it('conserve l’instance ApexCharts créée dans le signal interne', () => {
      expect(currentChart()).toBeInstanceOf(ApexCharts);
    });

    it('ne crée pas une seconde instance lors d’un init() répété', () => {
      const chart = currentChart();

      directive.init();

      expect(currentChart()).toBe(chart);
    });

    it('transmet les séries issues des données à la configuration', () => {
      const series = internals()._options.series;

      expect(series.length).toBe(1);
      expect(series[0].name).toBe('Ventes');
      expect(series[0].data.map((p: { y: number }) => p.y)).toEqual([10, 20, 15]);
    });

    it('utilise le type initial de la directive', () => {
      expect(internals()._options.chart.type).toBe('line');
    });
  });

  describe('isLoading, loadingLabel et noDataLabel', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('affiche le libellé « Aucune donnée » par défaut', () => {
      expect(internals()._options.noData.text).toBe('Aucune donnée');
    });

    it('affiche le libellé de chargement par défaut lorsque isLoading est vrai', () => {
      host.isLoading = true;
      fixture.detectChanges();

      expect(directive.isLoading).toBeTrue();
      expect(internals()._options.noData.text).toBe('Chargement des données...');
    });

    it('utilise le libellé de chargement personnalisé lorsque isLoading est vrai', () => {
      host.loadingLabel = 'Patientez';
      host.isLoading = true;
      fixture.detectChanges();

      expect(internals()._options.noData.text).toBe('Patientez');
    });

    it('revient au libellé « aucune donnée » lorsque le chargement se termine', () => {
      host.isLoading = true;
      fixture.detectChanges();

      host.isLoading = false;
      fixture.detectChanges();

      expect(internals()._options.noData.text).toBe('Aucune donnée');
    });

    it('utilise le libellé personnalisé « aucune donnée »', () => {
      host.noDataLabel = 'Rien à afficher';
      fixture.detectChanges();

      expect(internals()._options.noData.text).toBe('Rien à afficher');
    });

    it('revient au libellé par défaut lorsque noDataLabel est vide', () => {
      host.noDataLabel = 'Rien à afficher';
      fixture.detectChanges();

      host.noDataLabel = '';
      fixture.detectChanges();

      expect(internals()._options.noData.text).toBe('Aucune donnée');
    });

    it('revient au libellé de chargement par défaut lorsque loadingLabel est vide', () => {
      host.loadingLabel = '';
      host.isLoading = true;
      fixture.detectChanges();

      expect(internals()._options.noData.text).toBe('Chargement des données...');
    });
  });

  describe('canPivot', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('est désactivé par défaut et expose deux icônes personnalisées', () => {
      expect(directive.canPivot).toBeFalse();
      expect(internals()._options.chart.toolbar.tools.customIcons.length).toBe(2);
    });

    it('n’active le pivot que si la valeur vaut exactement true', () => {
      host.canPivot = 'true';
      fixture.detectChanges();

      expect(directive.canPivot).toBeFalse();
      expect(internals()._options.chart.toolbar.tools.customIcons.length).toBe(2);
    });

    it('ajoute l’icône de pivot lorsque canPivot vaut true', () => {
      host.canPivot = true;
      fixture.detectChanges();

      expect(directive.canPivot).toBeTrue();
      expect(internals()._options.chart.toolbar.tools.customIcons.length).toBe(3);
    });
  });

  describe('theme', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('applique le thème fourni aux options', () => {
      host.theme = { mode: 'dark' };
      fixture.detectChanges();

      expect(internals()._options.theme).toEqual({ mode: 'dark' });
    });

    it('supprime le thème lorsque la valeur est nulle', () => {
      host.theme = { mode: 'dark' };
      fixture.detectChanges();

      host.theme = null;
      fixture.detectChanges();

      expect(internals()._options.theme).toBeUndefined();
    });
  });

  describe('group et groupSync', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('retombe sur le groupe de la configuration lorsque group n’est pas défini', () => {
      host.config = { ...SAMPLE_CONFIG, group: 'groupe-config' };
      fixture.detectChanges();

      expect(directive.group).toBe('groupe-config');
    });

    it('privilégie le groupe saisi sur celui de la configuration', () => {
      host.config = { ...SAMPLE_CONFIG, group: 'groupe-config' };
      host.group = 'groupe-saisi';
      fixture.detectChanges();

      expect(directive.group).toBe('groupe-saisi');
    });

    it('vaut null lorsqu’aucun groupe n’est défini', () => {
      expect(directive.group).toBeNull();
    });

    it('synchronise tout par défaut', () => {
      expect(directive.groupSync).toBe('all');
    });

    it('privilégie le mode de synchronisation saisi', () => {
      host.groupSync = 'tooltip';
      fixture.detectChanges();

      expect(directive.groupSync).toBe('tooltip');
    });

    it('retombe sur le mode de synchronisation de la configuration', () => {
      host.config = { ...SAMPLE_CONFIG, groupSync: 'datazoom' };
      fixture.detectChanges();

      expect(directive.groupSync).toBe('datazoom');
    });
  });

  describe('mise à jour', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('met à jour les données sans recréer l’instance', async () => {
      const chart = currentChart();
      host.data = [{ mois: 'Jan', valeur: 99 }];
      fixture.detectChanges();

      await waitFor(() => internals()._options.series[0].data.length === 1);

      expect(currentChart()).toBe(chart);
      expect(internals()._options.series[0].data.map((p: { y: number }) => p.y)).toEqual([99]);
    });

    it('recrée l’instance lorsque renderedOption change', async () => {
      const chart = currentChart();
      host.renderedOption = { title: { text: 'Personnalisé' } };
      fixture.detectChanges();

      await waitFor(() => currentChart() !== chart && !!currentChart());

      expect(currentChart()).not.toBe(chart);
    });

    it('recrée l’instance avec le nouveau type lorsque type change', async () => {
      const chart = currentChart();
      host.type = 'area';
      fixture.detectChanges();

      await waitFor(() => currentChart() !== chart && !!currentChart());

      expect(internals()._options.chart.type).toBe('area');
    });

    it('ne fait rien lorsque le type ne change pas', () => {
      const chart = currentChart();
      host.type = 'line';
      fixture.detectChanges();

      expect(currentChart()).toBe(chart);
    });
  });

  describe('erreur de rendu', () => {
    it('émet renderError et réinitialise l’instance lorsque render() échoue', async () => {
      const failure = new Error('rendu impossible');
      spyOn(ApexCharts.prototype, 'render').and.callFake(() => Promise.reject(failure));

      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      directive = fixture.debugElement.query(By.directive(LineChartDirective)).injector.get(LineChartDirective);
      await waitFor(() => host.errors.length > 0);

      expect(host.errors[0].error).toBe(failure);
      expect(currentChart()).toBeNull();
    });
  });

  describe('destruction', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('détruit le graphique à la destruction de la directive', () => {
      const destroySpy = spyOn(currentChart() as ApexCharts, 'destroy').and.callThrough();

      fixture.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('retire le rendu du DOM à la destruction', () => {
      fixture.destroy();

      expect(element.querySelector('.apexcharts-canvas')).toBeNull();
    });

    it('ne recrée pas de graphique après destruction', async () => {
      fixture.destroy();
      directive.init();
      await settle();

      expect(currentChart()).toBeNull();
    });
  });

  describe('API exposée (ApexChartHandle)', () => {
    beforeEach(async () => {
      await createFixture();
    });

    it('exporte les données au format CSV avec les valeurs par défaut', () => {
      const exportSpy = spyOn(currentChart()!.exports, 'exportToCSV');

      directive.exportData();

      expect(exportSpy).toHaveBeenCalledWith({ fileName: 'data', columnDelimiter: ';' });
    });

    it('exporte les données avec le nom de fichier et le séparateur fournis', () => {
      const exportSpy = spyOn(currentChart()!.exports, 'exportToCSV');

      directive.exportData('ventes', ',');

      expect(exportSpy).toHaveBeenCalledWith({ fileName: 'ventes', columnDelimiter: ',' });
    });

    it('déclenche un événement resize sur la fenêtre', () => {
      const listener = jasmine.createSpy('resize');
      window.addEventListener('resize', listener);

      try {
        directive.resize();
      } finally {
        window.removeEventListener('resize', listener);
      }

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('exporte une image PNG en déclenchant un téléchargement nommé chart.png', async () => {
      const uri = 'data:image/png;base64,AAAA';
      spyOn(currentChart()!, 'dataURI').and.returnValue(Promise.resolve({ imgURI: uri } as any));
      let downloadName: string | null = null;
      let href: string | null = null;
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
        downloadName = this.download;
        href = this.href;
      });

      directive.exportImage();
      await waitFor(() => downloadName !== null);

      expect(downloadName).toBe('chart.png');
      expect(href).toBe(uri);
    });

    it('ne fait rien lors d’un export SVG lorsque le SVG est absent', () => {
      const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
      element.querySelectorAll('.apexcharts-svg').forEach(node => node.remove());

      directive.exportImage('graphique', 'svg');

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('retourne la clone de renderedOption lorsqu’elle est fournie', () => {
      const option = { title: { text: 'Titre' } };
      host.renderedOption = option;
      fixture.detectChanges();

      const rendered = directive.getRenderedOption() as typeof option;

      expect(rendered).toEqual(option);
      expect(rendered).not.toBe(option);
    });

    it('retourne la configuration effective du graphique sans renderedOption', () => {
      const rendered = directive.getRenderedOption() as any;

      expect(rendered).toBeTruthy();
      expect(rendered.chart.type).toBe('line');
    });
  });
});
