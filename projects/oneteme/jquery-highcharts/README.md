# jQuery-Highcharts

Une bibliothèque Angular intégrant Highcharts avec la syntaxe unifiée de jQuery-Charts.

## 📋 Table des matières

- [Installation](#installation)
- [Utilisation](#utilisation)
- [Documentation](#documentation)
- [Comparaison avec ApexCharts](#comparaison-avec-apexcharts)
- [License](#license)

## 🚀 Installation

```bash
npm install @oneteme/jquery-core @oneteme/jquery-highcharts highcharts
```

**Note importante**: Highcharts nécessite une licence commerciale pour une utilisation professionnelle. Assurez-vous d'acquérir la [licence appropriée](https://www.highcharts.com/license) avant toute utilisation commerciale.

## 💻 Utilisation

### 1. Importation des modules

```typescript
import { ChartComponent } from "@oneteme/jquery-highcharts";
import { field } from "@oneteme/jquery-core";

@NgModule({
  imports: [
    // ...
    ChartComponent,
  ],
  // ...
})
export class AppModule {}
```

### 2. Création d'un graphique

```html
<chart type="line" [config]="maConfig" [data]="mesDatas"></chart>
```

```typescript
import { ChartProvider, field } from "@oneteme/jquery-core";

// Configuration du graphique
maConfig: ChartProvider<string, number> = {
  title: "Mon graphique de ligne",
  series: [
    {
      data: {
        x: field("categorie"),
        y: field("valeur"),
      },
      name: "Série 1",
    },
  ],
  // Options spécifiques à Highcharts
  options: {
    chart: {
      type: "line",
      height: 400,
    },
  },
};

// Données du graphique
mesData = [
  { categorie: "A", valeur: 10 },
  { categorie: "B", valeur: 20 },
  { categorie: "C", valeur: 15 },
];
```

## 📖 Documentation

### Types de graphiques supportés

- **Line**: Graphiques linéaires (`line`) et graphiques de zone (`area`)
- **Bar**: Graphiques à barres horizontales (`bar`) et verticales (`column`)
- **Pie**: Graphiques circulaires (`pie`), anneau (`donut`), polaires (`polar`) et radar
- **Treemap**: Graphiques de carte arborescente
- **Heatmap**: Cartes de chaleur
- **Range**: Graphiques d'intervalles

### Options spécifiques à Highcharts

Vous pouvez passer des options spécifiques à Highcharts via la propriété `options`:

```typescript
maConfig = {
  // Configuration jQuery-Charts standard
  title: 'Mon graphique',
  series: [...],

  // Options spécifiques Highcharts
  options: {
    chart: {
      // Options du graphique Highcharts
    },
    plotOptions: {
      // Options de tracé Highcharts
    },
    // ... autres options Highcharts
  }
};
```

## 📄 License

Ce package est fourni sous licence Apache 2.0, mais veuillez noter que **Highcharts** nécessite une licence commerciale pour une utilisation professionnelle.

La documentation complète de Highcharts est disponible sur [leur site officiel](https://www.highcharts.com/docs/index).
