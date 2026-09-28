import { Injectable } from '@angular/core';
import StackBlitzSDK, { Project } from '@stackblitz/sdk';
import type { ChartType } from '@oneteme/jquery-core';
import type { ChartExampleSection } from 'src/app/pages/charts/chart-example-sections';

export type StackBlitzChartEngine = 'highcharts' | 'echarts' | 'apexcharts';

interface ChartExample {
  config: unknown;
  data: unknown[];
}

interface NpmPackageMetadata {
  version?: string;
  peerDependencies?: Record<string, string>;
}

interface EngineConfig {
  id: StackBlitzChartEngine;
  label: string;
  wrapperPackage: string;
  enginePackage: string;
  fallback: {
    core: string;
    wrapper: string;
    engine: string;
  };
}

const CORE_PACKAGE = '@oneteme/jquery-core';

const ENGINE_CONFIGS: Record<StackBlitzChartEngine, EngineConfig> = {
  highcharts: {
    id: 'highcharts',
    label: 'Highcharts',
    wrapperPackage: '@oneteme/jquery-highcharts',
    enginePackage: 'highcharts',
    fallback: { core: '^0.0.36', wrapper: '^0.0.13', engine: '^11.4.3' },
  },
  echarts: {
    id: 'echarts',
    label: 'ECharts',
    wrapperPackage: '@oneteme/jquery-echarts',
    enginePackage: 'echarts',
    fallback: { core: '^0.0.36', wrapper: '^0.0.11', engine: '^6.0.0' },
  },
  apexcharts: {
    id: 'apexcharts',
    label: 'ApexCharts',
    wrapperPackage: '@oneteme/jquery-apexcharts',
    enginePackage: 'apexcharts',
    fallback: { core: '^0.0.36', wrapper: '^0.0.27', engine: '^3.54.1' },
  },
};

const BASE_DEPENDENCIES: Record<string, string> = {
  '@angular/animations': '^16.2.12',
  '@angular/common': '^16.2.12',
  '@angular/compiler': '^16.2.12',
  '@angular/core': '^16.2.12',
  '@angular/platform-browser': '^16.2.12',
  '@angular/platform-browser-dynamic': '^16.2.12',
  '@angular-devkit/build-angular': '^16.2.16',
  '@angular/cli': '^16.2.16',
  '@angular/compiler-cli': '^16.2.12',
  rxjs: '~7.8.0',
  tslib: '^2.3.0',
  typescript: '~5.1.6',
  'zone.js': '~0.13.0',
};

@Injectable({ providedIn: 'root' })
export class StackBlitzService {
  private readonly packageMetadata = new Map<string, NpmPackageMetadata>();
  private readonly metadataRequests = new Map<string, Promise<NpmPackageMetadata | null>>();
  private readonly failedMetadata = new Set<string>();

  constructor() {
    this.preloadPackageMetadata(CORE_PACKAGE);
    Object.values(ENGINE_CONFIGS).forEach(config => this.preloadPackageMetadata(config.wrapperPackage));
  }

  openExample(engine: StackBlitzChartEngine, section: ChartExampleSection, example: ChartExample): void {
    const engineConfig = ENGINE_CONFIGS[engine];
    StackBlitzSDK.openProject(
      this.buildProject(engineConfig, section, example),
      {
        newWindow: true,
        openFile: 'src/app/app.component.ts',
        theme: 'light',
        view: 'default',
      },
    );
  }

  openHighchartsExample(section: ChartExampleSection, example: ChartExample): void {
    this.openExample('highcharts', section, example);
  }

  private buildProject(engine: EngineConfig, section: ChartExampleSection, example: ChartExample): Project {
    const dataSource = this.formatValue(example.data, example.data);
    const configSource = this.formatValue(example.config, example.data);

    return {
      title: `jquery-${engine.id} - ${section.label}`,
      description: `Exemple ${section.label} de ${engine.wrapperPackage}`,
      template: 'angular-cli',
      dependencies: this.buildDependencies(engine),
      files: {
        'src/index.html': this.buildIndexHtml(engine, section.label),
        'src/main.ts': this.buildMainSource(),
        'src/styles.scss': this.buildGlobalStyles(),
        'src/app/app.component.ts': this.buildComponentSource(engine, section.type, dataSource, configSource),
        'src/app/app.component.html': this.buildComponentTemplate(),
        'src/app/app.component.scss': this.buildComponentStyles(),
      },
      settings: {
        compile: {
          trigger: 'auto',
          action: 'hmr',
          clearConsole: false,
        },
      },
    };
  }

  private buildDependencies(engine: EngineConfig): Record<string, string> {
    const coreMetadata = this.packageMetadata.get(CORE_PACKAGE);
    const wrapperMetadata = this.packageMetadata.get(engine.wrapperPackage);
    const corePeerRange = wrapperMetadata?.peerDependencies?.[CORE_PACKAGE];

    return {
      ...BASE_DEPENDENCIES,
      [CORE_PACKAGE]: corePeerRange ?? this.resolveDependencyVersion(CORE_PACKAGE, coreMetadata?.version, engine.fallback.core),
      [engine.wrapperPackage]: this.resolveDependencyVersion(
        engine.wrapperPackage,
        wrapperMetadata?.version,
        engine.fallback.wrapper,
      ),
      [engine.enginePackage]: wrapperMetadata?.peerDependencies?.[engine.enginePackage] ?? engine.fallback.engine,
    };
  }

  private resolveDependencyVersion(packageName: string, version: string | undefined, fallback: string): string {
    if (version) return version;
    if (this.failedMetadata.has(packageName)) return fallback;
    return 'latest';
  }

  private preloadPackageMetadata(packageName: string): void {
    if (this.metadataRequests.has(packageName)) return;

    const request = fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`)
      .then(response => {
        if (!response.ok) throw new Error(`Unable to resolve ${packageName}`);
        return response.json() as Promise<unknown>;
      })
      .then(payload => {
        const metadata = this.parsePackageMetadata(payload);
        if (!metadata?.version) throw new Error(`Invalid metadata for ${packageName}`);
        this.packageMetadata.set(packageName, metadata);
        return metadata;
      })
      .catch(() => {
        this.failedMetadata.add(packageName);
        return null;
      });

    this.metadataRequests.set(packageName, request);
  }

  private parsePackageMetadata(payload: unknown): NpmPackageMetadata | null {
    if (!payload || typeof payload !== 'object') return null;

    const record = payload as Record<string, unknown>;
    const version = typeof record.version === 'string' ? record.version : undefined;
    const peerDependenciesRecord = record.peerDependencies;
    if (!peerDependenciesRecord || typeof peerDependenciesRecord !== 'object') return { version };

    const peerDependencies = Object.fromEntries(
      Object.entries(peerDependenciesRecord as Record<string, unknown>)
        .filter(([, range]) => typeof range === 'string')
        .map(([name, range]) => [name, range as string]),
    );

    return { version, peerDependencies };
  }

  private buildComponentSource(
    engine: EngineConfig,
    type: ChartType,
    dataSource: string,
    configSource: string,
  ): string {
    return `import { Component } from '@angular/core';
import { ChartComponent } from '${engine.wrapperPackage}';
import { field, joinFields, rangeFields, values } from '@oneteme/jquery-core';
import type { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  chartType: ChartType = ${JSON.stringify(type)};

  data = ${dataSource};

  config: ChartProvider<string, number> = ${configSource};
}
`;
  }

  private buildComponentTemplate(): string {
    return `<chart
  [type]="chartType"
  [config]="config"
  [data]="data"
></chart>
`;
  }

  private buildIndexHtml(engine: EngineConfig, label: string): string {
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(label)} - jquery-${engine.id}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`;
  }

  private buildMainSource(): string {
    return `import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch(error => console.error(error));
`;
  }

  private buildGlobalStyles(): string {
    return `:root {
  font-family: Arial, sans-serif;
  color: #17343a;
  background: #f5f7f6;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
`;
  }

  private buildComponentStyles(): string {
    return `:host {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  padding: 24px;
}

chart {
  display: block;
  width: min(820px, calc(100vw - 48px));
  height: min(500px, calc(100vh - 48px), calc((100vw - 48px) * 0.7));
}
`;
  }

  private formatValue(value: unknown, data: unknown[], indent = 0): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return this.formatProvider(value, data);

    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      const padding = ' '.repeat(indent);
      const childPadding = ' '.repeat(indent + 2);
      return `[
${value.map(item => `${childPadding}${this.formatValue(item, data, indent + 2)}`).join(',\n')}
${padding}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return '{}';
    const padding = ' '.repeat(indent);
    const childPadding = ' '.repeat(indent + 2);
    return `{
${entries.map(([key, item]) => `${childPadding}${this.formatPropertyKey(key)}: ${this.formatValue(item, data, indent + 2)}`).join(',\n')}
${padding}}`;
  }

  private formatProvider(provider: Function, data: unknown[]): string {
    const markerByField = new Map<string, string>();
    const fieldByMarker = new Map<string, string>();
    const row = new Proxy<Record<string, string>>({} as Record<string, string>, {
      get: (_target, property) => {
        if (typeof property !== 'string') return undefined;
        const existingMarker = markerByField.get(property);
        if (existingMarker) return existingMarker;
        const marker = `__stackblitz_field_${markerByField.size}__`;
        markerByField.set(property, marker);
        fieldByMarker.set(marker, property);
        return marker;
      },
    });

    let firstResult: unknown;
    let secondResult: unknown;
    try {
      firstResult = provider(row, 0);
    } catch {
      return provider.toString();
    }
    try {
      secondResult = provider(row, 1);
    } catch {
      secondResult = undefined;
    }

    const markers = [...fieldByMarker.keys()];
    const fieldNames = markers.map(marker => fieldByMarker.get(marker) as string);
    if (fieldNames.length === 1 && firstResult === markers[0]) {
      return `field(${JSON.stringify(fieldNames[0])})`;
    }

    if (
      Array.isArray(firstResult)
      && firstResult.length === markers.length
      && firstResult.every((value, index) => value === markers[index])
      && fieldNames.length > 1
    ) {
      return `rangeFields(${fieldNames.map(fieldName => JSON.stringify(fieldName)).join(', ')})`;
    }

    const joinSeparator = this.resolveJoinSeparator(firstResult, markers);
    if (joinSeparator !== null && fieldNames.length > 1) {
      return `joinFields(${JSON.stringify(joinSeparator)}, ${fieldNames.map(fieldName => JSON.stringify(fieldName)).join(', ')})`;
    }

    if (!fieldNames.length && firstResult !== undefined) {
      if (secondResult === undefined || Object.is(firstResult, secondResult)) {
        return `() => ${this.formatValue(firstResult, data)}`;
      }
      return `values(${this.formatValue(firstResult, data)}, ${this.formatValue(secondResult, data)})`;
    }

    return provider.toString();
  }

  private resolveJoinSeparator(value: unknown, markers: string[]): string | null {
    if (typeof value !== 'string' || markers.length < 2) return null;

    let cursor = 0;
    let separator: string | null = null;
    for (let index = 0; index < markers.length; index += 1) {
      const marker = markers[index];
      if (!value.startsWith(marker, cursor)) return null;
      cursor += marker.length;
      if (index === markers.length - 1) continue;

      const nextMarkerPosition = value.indexOf(markers[index + 1], cursor);
      if (nextMarkerPosition < 0) return null;
      const candidate = value.slice(cursor, nextMarkerPosition);
      if (separator === null) separator = candidate;
      else if (separator !== candidate) return null;
      cursor = nextMarkerPosition;
    }

    return cursor === value.length ? separator : null;
  }

  private formatPropertyKey(key: string): string {
    return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}