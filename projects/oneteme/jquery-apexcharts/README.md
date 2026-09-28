# @oneteme/jquery-apexcharts

Wrapper Angular d'[ApexCharts](https://apexcharts.com/) construit sur les contrats partagés de [@oneteme/jquery-core](https://www.npmjs.com/package/@oneteme/jquery-core).

> **Documentation et démonstrations** : [ouvrir l'application de documentation](https://oneteme.github.io/jquery-charts/)
>
> La documentation interactive montre les options natives, la toolbar, la synchronisation, le drilldown, l'Organizer, les exports et le plein écran.

## Fonctionnalités

- API Angular unifiée avec le composant standalone `<chart>` et `ChartProvider` ;
- types ApexCharts courants : `bar`, `column`, `line`, `area`, `pie`, `donut`, `polar`, `radar`, `radial`, `funnel`, `pyramid`, `heatmap`, `treemap`, `rangeArea`, `rangeBar` et `rangeColumn` ;
- options natives via `config.options` et priorité explicite de `[renderedOption]` ;
- toolbar masquée par défaut, activable avec `showToolbar: true` dans le provider ;
- synchronisation du tooltip et du zoom via `[group]` et `[groupSync]` ;
- visibilité des séries avec `[organizer]` et `[organizerState]` ;
- drilldown piloté par le parent avec fil d'Ariane et événements de navigation ;
- export PNG, JPEG, SVG et CSV, copie/restauration de snapshots visuels et plein écran.

## Installation

### Automatic Setup (Recommended)

Install and automatically configure the library with styles using Angular CLI:

```bash
ng add @oneteme/jquery-apexcharts
```

This command will:
- Install the package
- Automatically add the required styles to your `angular.json`

### Manual Installation

If you prefer manual installation using npm:

```bash
npm install @oneteme/jquery-apexcharts
```

**Note:** With `npm install`, you must manually add the styles to your project.

Then add the styles manually to your `angular.json`:

```json
{
  "styles": [
    "node_modules/@oneteme/jquery-apexcharts/styles/styles.scss"
  ]
}
```

Or import it in your global `styles.scss`:

```scss
@import '~@oneteme/jquery-apexcharts/styles/styles.scss';
```

## Utilisation

Le composant public est standalone et utilise le même contrat que les autres renderers :

```typescript
import { Component } from '@angular/core';
import { ChartComponent } from '@oneteme/jquery-apexcharts';
import { ChartProvider, field } from '@oneteme/jquery-core';

@Component({
  standalone: true,
  imports: [ChartComponent],
  template: `
    <chart
      type="line"
      [config]="config"
      [data]="data"
      [isLoading]="loading"
      [group]="'sales'"
      groupSync="all"
      (chartClick)="onChartClick($event)">
    </chart>
  `,
})
export class SalesChartComponent {
  loading = false;
  data = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 5800 },
    { month: 'Mar', revenue: 5100 },
  ];

  config: ChartProvider<string, number> = {
    title: 'Ventes mensuelles',
    series: [{
      name: 'Revenu',
      data: { x: field('month'), y: field('revenue') },
    }],
  };

  onChartClick(event: unknown): void {
    console.log(event);
  }
}
```

### Inputs et événements principaux

| Input / Output | Type | Rôle |
|---|---|---|
| `type` | `ChartType` | Type ApexCharts à afficher |
| `config` | `ChartProvider<X, Y>` | Configuration commune et séries |
| `data` | `any[]` | Lignes de données source |
| `isLoading` | `boolean` | Affiche l'état de chargement |
| `renderedOption` | `unknown` | Option ApexCharts fournie directement, prioritaire sur le provider |
| `theme` | `Record<string, unknown>` | Thème transmis au renderer |
| `organizer` / `organizerState` | `OrganizerConfig` / `OrganizerState` | Visibilité contrôlée des séries |
| `group` / `groupSync` | `string` / `GroupSyncMode` | Synchronisation tooltip et zoom |
| `drilldown` | `ChartDrilldownConfig` | Navigation entre niveaux pilotée par le parent |
| `chartClick` | `ChartClickEvent` | Donnée cliquée, notamment `name` pour le drilldown |
| `renderError` | `ChartRenderError` | Erreur de construction ou de rendu |
| `drilldownRequest` | `ChartDrilldownRequest` | Demande de chargement du niveau suivant |
| `visualCopied` | `VisualSnapshot` | Snapshot créé par copie visuelle |

### Export et plein écran

```typescript
@ViewChild(ChartComponent) chart?: ChartComponent<any, any>;

exportChart(): void {
  this.chart?.exportImage('ventes', 'png', 2);
  this.chart?.exportData('ventes.csv', ';');
}

async fullscreen(): Promise<void> {
  await this.chart?.toggleFullscreen();
}
```

`createVisualSnapshot()` capture la configuration sérialisable, les données et l'état Organizer. `applyVisualSnapshot()` restaure les éléments compatibles avec le graphique courant.

Les directives spécialisées exportées (`BarChartDirective`, `LineChartDirective`, etc.) sont les détails internes utilisés par `ChartComponent`. Pour une intégration applicative, utilisez le composant `<chart>`.

## Additional Documentation

Pour les exemples complets et la démonstration interactive, consultez la [documentation de l'application](https://oneteme.github.io/jquery-charts/). Le code source et les versions publiées sont disponibles dans le [dépôt du projet](https://github.com/oneteme/jquery-charts).
