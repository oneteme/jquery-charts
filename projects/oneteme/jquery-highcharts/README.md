# jQuery-Highcharts

Une bibliothèque Angular qui implémente l'interface `@oneteme/jquery-core` en utilisant Highcharts comme moteur de rendu. Cette bibliothèque agit comme un **wrapper** pour Highcharts, permettant d'utiliser la syntaxe unifiée de jQuery-Charts tout en bénéficiant de la puissance et des fonctionnalités avancées de Highcharts.

## Table des matières

- [Installation](#installation)
- [Utilisation](#utilisation)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Gestion des états](#gestion-des-états)
- [Licence](#licence)

## Installation

```bash
npm install @oneteme/jquery-core @oneteme/jquery-highcharts
```

**Note importante** : Highcharts nécessite une licence commerciale pour une utilisation professionnelle. Assurez-vous d'acquérir la [licence appropriée](https://www.highcharts.com/license) avant toute utilisation commerciale.

## Utilisation

### 1. Importation du composant

Le composant `ChartComponent` est standalone et peut être importé directement :

```typescript
import { Component } from "@angular/core";
import { ChartComponent } from "@oneteme/jquery-highcharts";
import { ChartProvider, field } from "@oneteme/jquery-core";

@Component({
  selector: "app-mon-graphique",
  standalone: true,
  imports: [ChartComponent],
  template: ` <chart [type]="chartType" [config]="chartConfig" [data]="chartData" [isLoading]="isLoading"> </chart> `,
})
export class MonGraphiqueComponent {
  chartType = "line";
  isLoading = false;

  chartConfig: ChartProvider<string, number> = {
    title: "Ventes mensuelles",
    series: [
      {
        data: {
          x: field("mois"),
          y: field("ventes"),
        },
        name: "Ventes 2024",
      },
    ],
  };

  chartData = [
    { mois: "Janvier", ventes: 1200 },
    { mois: "Février", ventes: 1900 },
    { mois: "Mars", ventes: 1500 },
  ];
}
```

### 2. Utilisation avec module (optionnel)

Si vous préférez utiliser des modules Angular traditionnels :

```typescript
import { NgModule } from "@angular/core";
import { ChartComponent } from "@oneteme/jquery-highcharts";

@NgModule({
  imports: [ChartComponent],
  // ...
})
export class AppModule {}
```

### 3. Exemple simple

```html
<chart type="bar" [config]="config" [data]="data"> </chart>
```

```typescript
import { field } from "@oneteme/jquery-core";

export class ExempleComponent {
  config = {
    title: "Répartition des ventes",
    series: [
      {
        data: {
          x: field("categorie"),
          y: field("valeur"),
        },
        name: "Montant",
      },
    ],
  };

  data = [
    { categorie: "Produit A", valeur: 10 },
    { categorie: "Produit B", valeur: 20 },
    { categorie: "Produit C", valeur: 15 },
  ];
}
```

## Documentation

### Types de graphiques supportés

La bibliothèque jQuery-Highcharts prend en charge une large gamme de types de graphiques :

#### Graphiques simples (single-series)

Ces graphiques affichent les données sous forme d'une seule série agrégée :

- **`pie`** : Graphique circulaire
- **`donut`** : Graphique en anneau (pie avec `innerSize: '40%'`)
- **`funnel`** : Graphique en entonnoir
- **`pyramid`** : Graphique pyramidal

#### Graphiques complexes (multi-series)

Ces graphiques peuvent afficher plusieurs séries simultanément :

- **`line`** : Graphique linéaire
- **`area`** : Graphique de zone
- **`spline`** : Graphique linéaire lissé
- **`areaspline`** : Graphique de zone lissé
- **`bar`** : Graphique à barres horizontales
- **`column`** : Graphique à barres verticales
- **`columnpyramid`** : Graphique à barres pyramidales
- **`scatter`** : Graphique de dispersion
- **`bubble`** : Graphique à bulles

#### Graphiques de visualisation de données

- **`heatmap`** : Carte de chaleur
- **`treemap`** : Carte arborescente

#### Graphiques polaires et radar

- **`polar`** : Colonnes en coordonnées polaires avec grille circulaire
- **`radar`** : Lignes en coordonnées polaires avec grille polygonale
- **`radarArea`** : Radar avec remplissage de zone
- **`radialBar`** : Barres radiales concentriques

#### Graphiques de plages (range)

Nécessitent des données avec `rangeFields(minField, maxField)` :

- **`columnrange`** : Colonnes avec plages
- **`arearange`** : Zones avec plages
- **`areasplinerange`** : Zones lissées avec plages

### Inputs du composant

| Input         | Type                  | Requis | Description                                              |
| ------------- | --------------------- | ------ | -------------------------------------------------------- |
| `type`        | `ChartType`           | ✅     | Type de graphique à afficher                             |
| `config`      | `ChartProvider<X, Y>` | ✅     | Configuration du graphique (jquery-core)                 |
| `data`        | `any[]`               | ✅     | Données à afficher                                       |
| `isLoading`   | `boolean`             | ❌     | État de chargement (défaut: `false`)                     |
| `debug`       | `boolean`             | ❌     | Mode debug avec logs console (défaut: `false`)           |
| `enablePivot` | `boolean`             | ❌     | Active le bouton pivot dans la toolbar (défaut: `false`) |

### Configuration du graphique (ChartProvider)

```typescript
interface ChartProvider<X, Y> {
  // Titres
  title?: string; // Titre principal
  subtitle?: string; // Sous-titre
  xtitle?: string; // Titre de l'axe X
  ytitle?: string; // Titre de l'axe Y

  // Dimensions
  width?: number; // Largeur en pixels
  height?: number; // Hauteur en pixels

  // Séries de données
  series: SerieProvider<X, Y>[];

  // Options de transformation
  pivot?: boolean; // Transposer séries ↔ catégories
  continue?: boolean; // Mode continu : [x,y] au lieu de catégories
  stacked?: boolean; // Empiler les séries
  xorder?: "asc" | "desc"; // Tri des catégories

  // Interface
  showToolbar?: boolean; // Afficher la toolbar de navigation

  // Options Highcharts natives
  options?: Highcharts.Options;
}
```

### Définition d'une série

```typescript
interface SerieProvider<X, Y> {
  data: {
    x: DataProvider<X>; // Fonction d'extraction de X
    y: DataProvider<Y>; // Fonction d'extraction de Y
  };
  name?: string | DataProvider<string>; // Nom de la série
  stack?: string | DataProvider<string>; // Groupe d'empilement
  color?: string | DataProvider<string>; // Couleur
  type?: string | DataProvider<string>; // Type spécifique
  visible?: boolean | DataProvider<boolean>; // Visibilité initiale
}
```

### Fonctions utilitaires (jquery-core)

```typescript
import { field, values, mapField, joinFields, combineFields, rangeFields } from '@oneteme/jquery-core';

// Extraire un champ d'un objet
field<T>(fieldName: string): DataProvider<T>

// Exemples :
x: field("month")          // obj => obj.month
y: field("sales")          // obj => obj.sales

// Valeurs statiques
values<T>(...values: T[]): DataProvider<T>

// Exemple :
name: values("Série A", "Série B")  // idx 0 => "Série A", idx 1 => "Série B"

// Mapper via un dictionnaire
mapField<T>(fieldName: string, map: Map<any, T>): DataProvider<T>

// Exemple :
const colorMap = new Map([
  ["urgent", "#e74c3c"],
  ["normal", "#3498db"]
]);
color: mapField("priority", colorMap)

// Joindre plusieurs champs
joinFields(separator: string, ...fieldNames: string[]): DataProvider<string>

// Exemple :
name: joinFields(" - ", "firstName", "lastName")  // "John - Doe"

// Combiner avec fonction personnalisée
combineFields<T>(combiner: (args: any[]) => T, fieldNames: string[]): DataProvider<T>

// Exemple :
y: combineFields(
  ([a, b]) => a + b,
  ["value1", "value2"]
)

// Plages de valeurs (pour graphiques range)
rangeFields<T>(minFieldName: string, maxFieldName: string): DataProvider<T[]>

// Exemple :
y: rangeFields("tempMin", "tempMax")  // [15, 25]
```

### Exemples d'utilisation

#### Graphique simple avec agrégation

Pour les graphiques de type `pie`, `donut`, `funnel`, `pyramid`, les données multi-séries sont automatiquement agrégées :

```typescript
// Si vous avez plusieurs séries, chaque série devient une part du pie
config = {
  title: "Répartition par équipe",
  series: [
    { data: { x: field("month"), y: field("salesTeamA") }, name: "Équipe A" },
    { data: { x: field("month"), y: field("salesTeamB") }, name: "Équipe B" },
  ],
};

data = [
  { month: "Jan", salesTeamA: 100, salesTeamB: 150 },
  { month: "Fev", salesTeamA: 120, salesTeamB: 180 },
];

// Résultat :
// - Part "Équipe A" : 220 (somme de 100 + 120)
// - Part "Équipe B" : 330 (somme de 150 + 180)
```

#### Graphique multi-séries

```typescript
config = {
  title: "Évolution des ventes",
  series: [
    { data: { x: field("month"), y: field("sales2023") }, name: "2023", color: "#3498db" },
    { data: { x: field("month"), y: field("sales2024") }, name: "2024", color: "#e74c3c" },
  ],
};

data = [
  { month: "Jan", sales2023: 1000, sales2024: 1200 },
  { month: "Fev", sales2023: 1100, sales2024: 1400 },
  { month: "Mar", sales2023: 1050, sales2024: 1350 },
];
```

#### Graphique empilé

```typescript
config = {
  title: "Ventes par catégorie",
  stacked: true,
  series: [
    { data: { x: field("month"), y: field("electronics") }, name: "Électronique" },
    { data: { x: field("month"), y: field("clothing") }, name: "Vêtements" },
    { data: { x: field("month"), y: field("food") }, name: "Alimentation" },
  ],
};
```

#### Graphique avec pivot

Le pivot transpose les données : les séries deviennent des catégories et vice-versa.

```typescript
// Sans pivot : chaque région = une série, chaque mois = une catégorie
config = {
  title: "Ventes par région",
  pivot: false,
  series: [{ data: { x: field("month"), y: field("value") }, name: field("region") }],
};

data = [
  { region: "Nord", month: "Jan", value: 100 },
  { region: "Sud", month: "Jan", value: 150 },
  { region: "Nord", month: "Fev", value: 120 },
  { region: "Sud", month: "Fev", value: 180 },
];
// Séries : "Nord" et "Sud"
// Catégories : ["Jan", "Fev"]

// Avec pivot : chaque mois = une série, chaque région = une catégorie
config = {
  title: "Ventes par région",
  pivot: true, // ← Activation du pivot
  series: [{ data: { x: field("month"), y: field("value") }, name: field("region") }],
};
// Séries : "Jan" et "Fev"
// Catégories : ["Nord", "Sud"]
```

#### Graphique polaire

```typescript
config = {
  title: "Performance radar",
  series: [
    {
      data: { x: field("skill"), y: field("score") },
      name: "Développeur",
    },
  ],
};

data = [
  { skill: "JavaScript", score: 85 },
  { skill: "TypeScript", score: 90 },
  { skill: "Angular", score: 80 },
  { skill: "CSS", score: 75 },
];
```

```html
<chart type="radar" [config]="config" [data]="data"></chart>
```

#### Graphique de plages

```typescript
import { rangeFields } from "@oneteme/jquery-core";

config = {
  title: "Températures mensuelles",
  series: [
    {
      data: {
        x: field("month"),
        y: rangeFields("tempMin", "tempMax"), // ← Plage [min, max]
      },
      name: "Température",
    },
  ],
};

data = [
  { month: "Jan", tempMin: 5, tempMax: 15 },
  { month: "Fev", tempMin: 7, tempMax: 18 },
  { month: "Mar", tempMin: 10, tempMax: 22 },
];
```

```html
<chart type="columnrange" [config]="config" [data]="data"></chart>
```

### Mode continue

Par défaut, les graphiques utilisent des catégories discrètes. Le mode `continue` permet d'afficher des coordonnées `[x, y]` continues :

```typescript
// Mode catégories (défaut)
config = {
  continue: false, // ou omis
  series: [{ data: { x: field("category"), y: field("value") } }],
};
// Résultat : categories = ["A", "B", "C"], data = [10, 20, 15]

// Mode continue
config = {
  continue: true,
  series: [{ data: { x: field("timestamp"), y: field("value") } }],
};
// Résultat : data = [[1609459200000, 10], [1609545600000, 20], ...]
```

### Toolbar de navigation

Activez la toolbar pour permettre la navigation entre types de graphiques :

```typescript
config = {
  title: "Graphique interactif",
  showToolbar: true,  // ← Active la toolbar
  series: [...]
};
```

La toolbar apparaît au survol et propose :

- **Bouton précédent** : Affiche le type de graphique précédent
- **Bouton suivant** : Affiche le type de graphique suivant
- **Bouton pivot** : Active/désactive le mode pivot (si `enablePivot: true`)

Groupes de navigation par défaut :

- Graphiques simples : `pie`, `spline`
- Graphiques linéaires : `line`, `pie`, `donut`, `bar`, `column`
- Graphiques de zone : `line`, `area`, `spline`, `areaspline`
- Graphiques à barres : `bar`, `column`
- Graphiques d'entonnoir : `funnel`, `pyramid`
- Graphiques de dispersion : `scatter`, `bubble`
- Graphiques polaires : `polar`, `radar`, `line`
- Graphiques radar : `radar`, `polar`, `radarArea`
- Graphiques radar avec zone : `radarArea`, `radar`, `area`
- Graphiques radiaux : `radialBar`, `bar`, `column`

### Options Highcharts personnalisées

Vous pouvez passer n'importe quelle option Highcharts native via `config.options` :

```typescript
config = {
  title: "Graphique personnalisé",
  series: [...],
  options: {
    chart: {
      backgroundColor: '#f5f5f5',
      borderWidth: 1,
      borderColor: '#ddd'
    },
    plotOptions: {
      series: {
        animation: false,
        dataLabels: {
          enabled: true,
          format: '{point.y:.1f}'
        }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      shared: true,
      crosshairs: true
    }
  }
};
```

### Système de transformation plotOptions

La bibliothèque unifie la syntaxe `plotOptions.series.*` pour tous les types de graphiques. Les propriétés sont automatiquement transformées vers les propriétés spécifiques de chaque type.

#### Exemple de transformation

```typescript
// Configuration utilisateur
options: {
  plotOptions: {
    series: {
      dataLabels: { enabled: true },
      borderWidth: 2
    }
  }
}

// Pour type="pie", sera transformé en :
plotOptions: {
  pie: {
    dataLabels: { enabled: true },
    borderWidth: 2
  }
}

// Pour type="line", sera transformé en :
plotOptions: {
  line: {
    dataLabels: { enabled: true }
    // borderWidth n'est pas supporté par line, donc ignoré
  }
}
```

Voir le fichier `types.ts` pour le mapping complet des propriétés supportées par type.

## Architecture

### Vue d'ensemble

jQuery-Highcharts est organisé en plusieurs modules spécialisés pour une meilleure maintenabilité :

```
jquery-highcharts/
├── src/
│   ├── public-api.ts                    # API publique
│   ├── lib/
│   │   ├── component/
│   │   │   └── chart.component.ts       # Composant wrapper Angular
│   │   ├── directive/
│   │   │   ├── chart.directive.ts       # Directive principale
│   │   │   └── utils/
│   │   │       ├── index.ts
│   │   │       ├── highcharts-modules.ts    # Initialisation Highcharts
│   │   │       ├── data-aggregation.ts      # Agrégation pour pie/donut
│   │   │       ├── dimensions.ts            # Gestion width/height
│   │   │       ├── loading.ts               # États de chargement
│   │   │       ├── polar-config.ts          # Configuration polaire
│   │   │       ├── toolbar.ts               # Toolbar de navigation
│   │   │       └── types.ts                 # Types et mappings
│   │   └── assets/
│   │       └── icons/                       # Icônes SVG de la toolbar
```

### Flux de transformation des données

```
Données brutes (data: any[])
        ↓
buildChart() ou buildSingleSerieChart() (jquery-core)
        ↓
CommonChart<X, Y> (modèle abstrait)
        ↓
processData() (chart.directive.ts)
        ↓
- processSimpleChart() → transformDataForSimpleChart() → Agrégation
- processComplexChart() → Conversion multi-séries
        ↓
Options Highcharts (Highcharts.Options)
        ↓
- configurePolarChart() (si polar)
- unifyPlotOptionsForChart() (transformation plotOptions)
- configureLoadingOptions() (configuration loading)
        ↓
Highcharts.chart() → Rendu visuel
```

### Modules utilitaires

#### `highcharts-modules.ts`

Initialise tous les modules Highcharts nécessaires :

- `highcharts-more` : Types supplémentaires (bubble, polar, etc.)
- `no-data-to-display` : Affichage "aucune donnée"
- `exporting` : Export des graphiques
- `export-data` : Export des données
- `funnel` : Graphiques en entonnoir
- `treemap` : Cartes arborescentes
- `heatmap` : Cartes de chaleur

#### `data-aggregation.ts`

Gère l'agrégation des données multi-séries pour les graphiques simples (pie, donut, funnel, pyramid).

**Fonctions principales** :

- `aggregateMultiSeriesForPie()` : Agrège plusieurs séries en calculant la somme totale de chaque série
- `shouldAggregateForPie()` : Détermine si l'agrégation est nécessaire
- `transformDataForSimpleChart()` : Point d'entrée pour la transformation

**Exemple** :

```typescript
// Entrée : 2 séries avec 3 catégories chacune
series: [
  { name: "Équipe A", data: [100, 120, 110] },
  { name: "Équipe B", data: [150, 180, 160] },
][
  // Sortie : 2 parts agrégées
  ({ name: "Équipe A", y: 330 }, // 100 + 120 + 110
  { name: "Équipe B", y: 490 }) // 150 + 180 + 160
];
```

#### `dimensions.ts`

Gère les dimensions du graphique en utilisant celles du conteneur parent si non spécifiées.

**Fonction** :

- `sanitizeChartDimensions()` : Calcule automatiquement width/height depuis le conteneur

#### `loading.ts`

Gère les trois états d'affichage du graphique :

1. **Chargement** : Affiche un indicateur de chargement
2. **Aucune donnée** : Affiche un message "Aucune donnée"
3. **Données disponibles** : Affiche le graphique avec la toolbar

**Fonctions principales** :

- `updateChartLoadingState()` : Orchestre les transitions entre états
- `showLoading()` / `hideLoading()` : Gestion du loading
- `showNoDataMessage()` : Affichage du message "no data"
- `showChartToolbar()` / `hideChartToolbar()` : Gestion de la toolbar
- `configureLoadingOptions()` : Configuration par défaut

**Machine à états** :

```
isLoading=true, hasData=false  → Loading affiché, toolbar masquée
isLoading=false, hasData=false → "Aucune donnée" affiché, toolbar masquée
isLoading=false, hasData=true  → Graphique affiché, toolbar visible
```

#### `polar-config.ts`

Configure les graphiques en coordonnées polaires.

**Fonctions** :

- `configurePolarChart()` : Point d'entrée principal
- `configurePolarType()` : Secteurs empilés avec grille circulaire
- `configureRadarType()` : Toile d'araignée avec grille polygonale
- `configureRadarAreaType()` : Radar avec remplissage
- `configureRadialBarType()` : Barres concentriques
- `isPolarChart()` : Détecte si un type est polaire

**Configuration automatique** :

- Active `chart.polar = true`
- Configure les axes X/Y pour le mode polaire
- Applique `gridLineInterpolation` (circle ou polygon)
- Gère le `pane` et les options de colonnes

#### `toolbar.ts`

Crée et gère la toolbar de navigation entre types de graphiques.

**Fonctions** :

- `setupToolbar()` : Crée la toolbar avec boutons
- `createToolbarButton()` : Crée un bouton avec icône SVG
- `removeToolbar()` : Nettoie la toolbar
- Gestionnaires `handleMouseMove()` / `handleMouseLeave()` : Visibilité au survol

**Comportement** :

- Toolbar en position absolue en haut à droite
- Apparaît au survol du graphique
- Émet des événements `previous`, `next`, `pivot`

#### `types.ts`

Définit les types TypeScript et le système de mapping des plotOptions.

**Exports principaux** :

- `ChartCustomEvent` : Type des événements de la toolbar
- `ToolbarOptions` : Options de configuration de la toolbar
- `PLOTOPTIONS_MAPPING` : Mapping complet `series.*` → `type.*`
- `unifyPlotOptionsForChart()` : Transforme les plotOptions

**Mapping** :

```typescript
PLOTOPTIONS_MAPPING = {
  pie: {
    "series.dataLabels": "pie.dataLabels",
    "series.borderWidth": "pie.borderWidth",
    // ...
  },
  line: {
    "series.marker": "line.marker",
    "series.lineWidth": "line.lineWidth",
    // ...
  },
  // ... autres types
};
```

### ChartDirective

La directive principale qui :

1. Reçoit les inputs : `type`, `config`, `data`, `isLoading`
2. Appelle `buildChart()` ou `buildSingleSerieChart()` (jquery-core)
3. Transforme le `CommonChart` en options Highcharts
4. Applique les configurations spécifiques (polar, plotOptions, loading)
5. Crée l'instance Highcharts
6. Gère le cycle de vie (destroy, update)

### ChartComponent

Composant wrapper qui :

- Encapsule la directive
- Gère la navigation entre types via les événements
- Définit les groupes de types compatibles
- Gère le mode pivot

## Gestion des états

### Propriété `isLoading`

Contrôlez l'affichage du loading via l'input `isLoading` :

```html
<chart type="line" [config]="config" [data]="data" [isLoading]="isLoading"> </chart>
```

```typescript
export class MesVentesComponent implements OnInit {
  isLoading = false;
  data: any[] = [];

  async ngOnInit() {
    this.isLoading = true;

    try {
      this.data = await this.fetchSalesData();
    } finally {
      this.isLoading = false;
    }
  }
}
```

### États automatiques

Le graphique gère automatiquement 3 états :

1. **Chargement initial** (`isLoading=true`, `data=[]`)

   - Affiche : Spinner + texte "Chargement des données..."
   - Toolbar : Masquée

2. **Aucune donnée** (`isLoading=false`, `data=[]`)

   - Affiche : Message "Aucune donnée disponible"
   - Toolbar : Masquée

3. **Données chargées** (`isLoading=false`, `data=[...]`)
   - Affiche : Graphique avec données
   - Toolbar : Visible au survol (si `showToolbar=true`)

### Exemple complet avec gestion d'état

```typescript
@Component({
  selector: "app-sales-chart",
  standalone: true,
  imports: [ChartComponent, CommonModule],
  template: `
    <div class="chart-wrapper">
      <h2>Ventes par région</h2>

      <chart type="column" [config]="chartConfig" [data]="salesData" [isLoading]="isLoadingSales"> </chart>

      <button (click)="refreshData()" [disabled]="isLoadingSales">
        {{ isLoadingSales ? "Chargement..." : "Actualiser" }}
      </button>
    </div>
  `,
})
export class SalesChartComponent {
  isLoadingSales = false;
  salesData: any[] = [];

  chartConfig = {
    title: "Ventes 2024",
    showToolbar: true,
    series: [
      {
        data: {
          x: field("region"),
          y: field("amount"),
        },
        name: "Chiffre d'affaires",
      },
    ],
  };

  constructor(private salesService: SalesService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async refreshData() {
    await this.loadData();
  }

  private async loadData() {
    this.isLoadingSales = true;

    try {
      // Simulation d'un appel API
      this.salesData = await this.salesService.getSales();
    } catch (error) {
      console.error("Erreur de chargement:", error);
      this.salesData = []; // Affichera "Aucune donnée"
    } finally {
      this.isLoadingSales = false;
    }
  }
}
```

### Mode debug

Activez le mode debug pour voir les logs de transformation :

```html
<chart [type]="chartType" [config]="config" [data]="data" [debug]="true"> </chart>
```

Les logs afficheront :

- Détection du type de graphique (simple vs complexe)
- Transformations des plotOptions
- Ajustements de dimensions
- Création et destruction du graphique

## Licence

Ce package est fourni sous **licence Apache 2.0**.

**Important** : Highcharts nécessite une licence commerciale pour une utilisation professionnelle. Consultez la [page de licence Highcharts](https://www.highcharts.com/license) pour plus d'informations.

### Documentation Highcharts

Pour aller plus loin avec les options Highcharts :

- [Documentation officielle Highcharts](https://www.highcharts.com/docs/index)
- [API Reference Highcharts](https://api.highcharts.com/highcharts/)
- [Exemples Highcharts](https://www.highcharts.com/demo)

---

**Développé par** : [@oneteme](https://github.com/oneteme)  
**Repository** : [jquery-charts](https://github.com/oneteme/jquery-charts)
