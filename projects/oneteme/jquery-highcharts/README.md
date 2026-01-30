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

Installez la bibliothèque et ses dépendances :

```bash
npm install @oneteme/jquery-core @oneteme/jquery-highcharts highcharts
```

**Versions requises** :

- **Highcharts** : Version **11.4.3** minimum.
- **Cartes** (Optionnel) : Si vous souhaitez héberger les cartes Highcharts localement (recommandé pour les applications hors ligne ou professionnelles), installez la collection de cartes :

```bash
npm install @highcharts/map-collection
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
| :------------ | :-------------------- | :----- | :------------------------------------------------------- |
| `type`        | `ChartType`           | Oui    | Type de graphique à afficher                             |
| `config`      | `ChartProvider<X, Y>` | Oui    | Configuration du graphique (jquery-core)                 |
| `data`        | `any[]`               | Oui    | Données à afficher                                       |
| `isLoading`   | `boolean`             | Non    | État de chargement (défaut: `false`)                     |
| `debug`       | `boolean`             | Non    | Mode debug avec logs console (défaut: `false`)           |
| `enablePivot` | `boolean`             | Non    | Active le bouton pivot dans la toolbar (défaut: `false`) |

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

Cette section détaille la structure du projet et le rôle de chaque fichier principal.

### Structure des fichiers

- **src/public-api.ts** : Point d'entrée de la bibliothèque, exportant les modules, composants et services publics.
- **src/lib/component/chart.component.ts** : Composant Angular `<chart>` agissant comme conteneur principal. Il gère l'interface utilisateur, la barre d'outils et le basculement entre les types de graphiques.
- **src/lib/directive/chart.directive.ts** : Directive responsable de l'intégration avec Highcharts. Elle gère le cycle de vie du graphique, la transformation des données et l'application des configurations.

### Utilitaires (src/lib/directive/utils/)

- **highcharts-modules.ts** : Gestion de l'importation et de l'initialisation des modules Highcharts requis.
- **data-aggregation.ts** : Logique d'agrégation des données pour les graphiques simples (secteurs, entonnoirs).
- **dimensions.ts** : Gestion du redimensionnement et de l'adaptation aux dimensions du conteneur parent.
- **loading.ts** : Gestion des états d'affichage (chargement, aucune donnée, erreur).
- **toolbar.ts** : Création et gestion de la barre d'outils de navigation interactive.
- **types.ts** : Définitions des types TypeScript et interfaces partagées.
- **chart-data-validator.ts** : Validation de l'intégrité des données avant le rendu.

### Configurations (src/lib/directive/utils/config/)

- **chart-config-registry.ts** : Registre centralisant les configurations spécifiques à chaque type de graphique.
- **simple-chart-config.ts** : Configuration pour les graphiques simples (Pie, Donut, Funnel, Pyramid).
- **polar-config.ts** : Configuration pour les graphiques polaires et radars.
- **map-config.ts** : Configuration pour les cartes géographiques.
- **heatmap-config.ts** : Configuration pour les cartes de chaleur.
- **treemap-config.ts** : Configuration pour les cartes arborescentes.
- **range-config.ts** : Configuration pour les graphiques de plages de valeurs.
- **scatter-config.ts** : Configuration pour les graphiques de dispersion.
- **bubble-config.ts** : Configuration pour les graphiques à bulles.

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

   - Affiche : Texte "Chargement des données..."

2. **Aucune donnée** (`isLoading=false`, `data=[]`)

   - Affiche : Message "Aucune donnée"

3. **Données chargées** (`isLoading=false`, `data=[...]`)
   - Affiche : Graphique avec données

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
