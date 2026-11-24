import StackBlitzSDK, { Project } from '@stackblitz/sdk';
import type { ChartExampleSection } from 'src/app/pages/charts/chart-example-sections';
import { StackBlitzService } from './stackblitz.service';

describe('StackBlitzService', () => {
  const section: ChartExampleSection = { id: 'bar', label: 'Bar (horizontal)', type: 'bar', exampleKey: 'barExample' };
  const example = {
    config: { label: (row: { name: string }) => row.name },
    data: [{ name: 'Lundi', count: 3 }],
  };

  function jsonResponse(body: unknown, ok = true): Promise<Response> {
    return Promise.resolve(new Response(JSON.stringify(body), { status: ok ? 200 : 404 }));
  }

  function mockRegistry(metadataByPackage: Record<string, unknown>): void {
    spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = decodeURIComponent(String(input));
      const packageName = Object.keys(metadataByPackage).find(name => url.includes(`/${name}/latest`));
      return packageName ? jsonResponse(metadataByPackage[packageName]) : jsonResponse({}, false);
    });
  }

  function flushRequests(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 20));
  }

  function openedProject(): Project {
    return (StackBlitzSDK.openProject as jasmine.Spy).calls.mostRecent().args[0] as Project;
  }

  beforeEach(() => {
    spyOn(StackBlitzSDK, 'openProject');
  });

  it('ouvre un projet Angular dans une nouvelle fenêtre sur le composant principal', async () => {
    mockRegistry({});
    const service = new StackBlitzService();
    await flushRequests();

    service.openExample('echarts', section, example);

    expect(StackBlitzSDK.openProject).toHaveBeenCalledWith(
      jasmine.objectContaining({ template: 'angular-cli' }),
      { newWindow: true, openFile: 'src/app/app.component.ts', theme: 'light', view: 'default' },
    );
  });

  it('génère le composant avec le type, les données et une configuration basée sur les champs', async () => {
    mockRegistry({});
    const service = new StackBlitzService();
    await flushRequests();

    service.openExample('echarts', section, example);
    const component = openedProject().files!['src/app/app.component.ts'] as string;

    expect(component).toContain('chartType: ChartType = "bar";');
    expect(component).toContain('"Lundi"');
    expect(component).toContain('label: field("name")');
  });

  it('combine les champs d\'un libellé composé en joinFields avec le séparateur détecté', async () => {
    mockRegistry({});
    const service = new StackBlitzService();
    await flushRequests();

    service.openExample('echarts', section, {
      config: { text: (row: { name: string; count: number }) => `${row.name} - ${row.count}` },
      data: [],
    });
    const component = openedProject().files!['src/app/app.component.ts'] as string;

    expect(component).toContain('text: joinFields(" - ", "name", "count")');
  });

  it('utilise la version publiée du wrapper et la plage de peer dependencies du registre', async () => {
    mockRegistry({
      '@oneteme/jquery-core': { version: '0.0.40' },
      '@oneteme/jquery-echarts': {
        version: '0.0.12',
        peerDependencies: { '@oneteme/jquery-core': '^0.0.40', echarts: '^6.1.0' },
      },
    });
    const service = new StackBlitzService();
    await flushRequests();

    service.openExample('echarts', section, example);
    const dependencies = openedProject().dependencies!;

    expect(dependencies['@oneteme/jquery-core']).toBe('^0.0.40');
    expect(dependencies['@oneteme/jquery-echarts']).toBe('0.0.12');
    expect(dependencies['echarts']).toBe('^6.1.0');
  });

  it('replie sur les versions de secours quand le registre est injoignable', async () => {
    mockRegistry({});
    const service = new StackBlitzService();
    await flushRequests();

    service.openExample('echarts', section, example);
    const dependencies = openedProject().dependencies!;

    expect(dependencies['@oneteme/jquery-core']).toBe('^0.0.36');
    expect(dependencies['@oneteme/jquery-echarts']).toBe('^0.0.11');
    expect(dependencies['echarts']).toBe('^6.0.0');
  });
});
