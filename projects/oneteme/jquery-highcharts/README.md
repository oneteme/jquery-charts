# jQuery-Highcharts

Une bibliothèque Angular intégrant Highcharts avec la syntaxe unifiée de jQuery-Charts.

## Table des matières

- [Installation](#installation)
- [Utilisation](#utilisation)
- [Documentation](#documentation)
- [Comparaison avec ApexCharts](#comparaison-avec-apexcharts)
- [License](#license)

## Installation

```bash
npm install @oneteme/jquery-core @oneteme/jquery-highcharts highcharts
```

**Note importante**: Highcharts nécessite une licence commerciale pour une utilisation professionnelle. Assurez-vous d'acquérir la [licence appropriée](https://www.highcharts.com/license) avant toute utilisation commerciale.

## Utilisation

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
    ...
  },
};

// Données du graphique
mesData = [
  { categorie: "A", valeur: 10 },
  { categorie: "B", valeur: 20 },
  { categorie: "C", valeur: 15 },
];
```

## Documentation

### Types de graphiques supportés

La bibliothèque jQuery-Highcharts prend en charge une large gamme de types de graphiques, organisés en plusieurs catégories :

#### Graphiques simples
- **`pie`** : Graphiques circulaires (secteurs)
- **`donut`** : Graphiques en anneau (donut charts)
- **`funnel`** : Graphiques en entonnoir
- **`pyramid`** : Graphiques pyramidaux

#### Graphiques polaires et radar
- **`polar`** : Graphiques polaires (colonnes en coordonnées polaires)
- **`radar`** : Graphiques radar (lignes en coordonnées polaires)
- **`radarArea`** : Graphiques radar avec remplissage de zone
- **`radialBar`** : Barres radiales (colonnes polaires inversées)

#### Graphiques complexes
- **`line`** : Graphiques linéaires
- **`area`** : Graphiques de zone
- **`spline`** : Graphiques linéaires lissés
- **`areaspline`** : Graphiques de zone lissés
- **`bar`** : Graphiques à barres horizontales
- **`column`** : Graphiques à barres verticales
- **`columnpyramid`** : Graphiques à barres pyramidales
- **`scatter`** : Graphiques de dispersion
- **`bubble`** : Graphiques à bulles
- **`heatmap`** : Cartes de chaleur
- **`treemap`** : Cartes arborescentes

#### Graphiques de plages (range)
Ces types nécessitent des données spécifiques avec des valeurs de plage :
- **`columnrange`** : Colonnes avec plages de valeurs
- **`arearange`** : Zones avec plages de valeurs
- **`areasplinerange`** : Zones lissées avec plages de valeurs

### Système de configuration unifié

La bibliothèque implémente un système de configuration unifié qui révolutionne l'utilisation des graphiques en permettant d'utiliser la syntaxe `plotOptions.series.*` pour tous les types de graphiques. 

**L'objectif principal** : Permettre à l'utilisateur de **switcher dynamiquement entre différents types de graphiques** sans avoir à refaire la configuration à chaque fois. Le système transforme automatiquement ces propriétés génériques vers les propriétés spécifiques à chaque type de graphique.

#### Pourquoi ce système ?

Imaginez que vous voulez permettre à vos utilisateurs de visualiser les mêmes données sous forme de :
- **Camembert** (`pie`) avec des labels
- **Barres** (`bar`) avec les mêmes labels
- **Radar** (`radar`) avec les mêmes paramètres

**Sans le système unifié** :
```typescript
// Vous devriez gérer 3 configurations différentes
const configPie = { plotOptions: { pie: { dataLabels: {...} } } };
const configBar = { plotOptions: { bar: { dataLabels: {...} } } };
const configRadar = { plotOptions: { series: { dataLabels: {...} } } };
```

**Avec le système unifié** :
```typescript
// Une seule configuration pour tous les types !
const configUnique = { 
  plotOptions: { 
    series: { dataLabels: {...} }  // Fonctionne pour TOUS les types
  } 
};
```

#### Comment ça fonctionne

```typescript
// SYNTAXE UNIFIÉE - Fonctionne pour tous les types
const config = {
  title: "Mon graphique",
  series: [...],
  options: {
    plotOptions: {
      series: {
        dataLabels: { enabled: true },  // Sera transformé automatiquement
        borderWidth: 2,                 // Sera transformé automatiquement
        borderColor: '#333333'          // Sera transformé automatiquement
      }
    }
  }
};
```

#### Transformations automatiques par type

**Pour les graphiques `pie` et `donut` :**
```typescript
// Votre configuration
plotOptions: {
  series: {
    dataLabels: { enabled: true },
    allowPointSelect: true,
    cursor: 'pointer',
    borderWidth: 2,
    innerSize: '40%'
  }
}

// Sera transformé en
plotOptions: {
  pie: {
    dataLabels: { enabled: true },
    allowPointSelect: true, 
    cursor: 'pointer',
    borderWidth: 2,
    innerSize: '40%'
  }
}
```

**Pour les graphiques `funnel` et `pyramid` :**
```typescript
// Votre configuration
plotOptions: {
  series: {
    dataLabels: { enabled: true },
    borderWidth: 1,
    center: ['50%', '50%'],
    height: '80%'
  }
}

// Sera transformé en
plotOptions: {
  funnel: { // ou pyramid
    dataLabels: { enabled: true },
    borderWidth: 1,
    center: ['50%', '50%'],
    height: '80%'
  }
}
```

**Pour les graphiques polaires (`polar`, `radar`, `radarArea`, `radialBar`) :**
```typescript
// Votre configuration
plotOptions: {
  series: {
    dataLabels: { enabled: true },
    pointPlacement: 'on',
    connectEnds: true,
    marker: { enabled: true }
  }
}

// Sera transformé en préservant la structure polaire
plotOptions: {
  series: {
    dataLabels: { enabled: true },
    pointPlacement: 'on',
    connectEnds: true,
    marker: { enabled: true }
  },
  // + configurations spécifiques aux axes polaires
}
```

#### Propriétés supportées par type

| Type | Propriétés `plotOptions.series.*` supportées |
|------|---------------------------------------------|
| **pie/donut** | `dataLabels`, `allowPointSelect`, `cursor`, `showInLegend`, `borderWidth`, `borderColor`, `slicedOffset`, `startAngle`, `endAngle`, `center`, `size`, `innerSize`, `depth` |
| **funnel/pyramid** | `dataLabels`, `borderWidth`, `borderColor`, `center`, `height`, `width`, `neckWidth`, `neckHeight`, `reversed` |
| **polar** | `pointPlacement`, `pointStart`, `connectEnds`, `dataLabels` + propriétés `column.*` |
| **radar/radarArea** | `pointPlacement`, `pointStart`, `connectEnds`, `marker`, `dataLabels`, `fillOpacity` |
| **radialBar** | `pointPlacement`, `pointStart`, `connectEnds`, `dataLabels` + propriétés `column.*` |
| **line/area/spline/areaspline** | `dataLabels`, `marker`, `lineWidth`, `fillOpacity`, `dashStyle` |
| **bar/column/columnpyramid** | `dataLabels`, `borderWidth`, `borderColor`, `pointPadding`, `groupPadding`, `stacking` |
| **scatter/bubble** | `dataLabels`, `marker`, `sizeBy`, `minSize`, `maxSize` |
| **heatmap** | `dataLabels`, `borderWidth`, `borderColor`, `nullColor`, `colsize`, `rowsize` |
| **treemap** | `dataLabels`, `borderWidth`, `borderColor`, `layoutAlgorithm`, `layoutStartingDirection`, `alternateStartingDirection`, `levels` |
| **range (columnrange/arearange/areasplinerange)** | `dataLabels`, `borderWidth`, `borderColor`, `fillOpacity`, `lineWidth` |

### Ordre de priorité des configurations

Le système applique les configurations dans un ordre précis pour garantir que les préférences utilisateur soient toujours respectées :

1. **Nettoyage intelligent** : Suppression des propriétés conflictuelles selon le type de graphique
2. **Configuration framework** : Application des configurations par défaut de jQuery-Charts
3. **Configuration de base du type** : Application des paramètres spécifiques au type de graphique
4. **Transformation utilisateur** : Application du système de transformation unifié
5. **Fusion finale** : Combinaison respectant la priorité utilisateur

#### Exemple de priorité

```typescript
// Configuration de base (pie)
plotOptions: {
  pie: {
    innerSize: 0,           // Configuration par défaut
    dataLabels: { enabled: false }
  }
}

// Configuration utilisateur
options: {
  plotOptions: {
    series: {
      dataLabels: { enabled: true }  // Priorité utilisateur
    }
  }
}

// Résultat final : La préférence utilisateur est préservée
plotOptions: {
  pie: {
    innerSize: 0,
    dataLabels: { enabled: true }   // Priorité utilisateur respectée
  }
}
```

### Toolbar interactive et transitions entre types

La bibliothèque inclut une **toolbar personnalisée** qui permet aux utilisateurs finaux de naviguer entre différents types de graphiques de manière fluide, sans perte de configuration.

#### Activation de la toolbar

```typescript
maConfig = {
  title: "Ventes par région",
  series: [{ 
    data: { x: field("region"), y: field("ventes") },
    name: "Ventes" 
  }],
  showToolbar: true,  // Active la toolbar
  // Configuration unifiée qui fonctionne pour tous les types
  options: {
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
        borderWidth: 2
      }
    }
  }
};
```

#### Fonctionnalités de la toolbar

La toolbar apparaît au survol du graphique et propose 2 actions simples :

| Bouton | Action | Description |
|--------|--------|-------------|
| **Précédent** | `previous` | Passe au type de graphique précédent dans la liste |
| **Suivant** | `next` | Passe au type de graphique suivant dans la liste |

#### Types de graphiques liés

**Par défaut**, la toolbar navigue automatiquement entre tous les types excepté les types 'range' qui ne sont compatibles qu'entre (car ils nécessitent des données adaptées). Voici toutefois un classement des graphiques les plus compatibles entre eux :

**Graphiques simples** :
- `pie` ↔ `donut` ↔ `funnel` ↔ `pyramid`

**Graphiques polaires** :
- `polar` ↔ `radar` ↔ `radarArea` ↔ `radialBar`

**Graphiques complexes** :
- `line` ↔ `area` ↔ `spline` ↔ `areaspline` ↔ `bar` ↔ `column` ↔ `columnpyramid` ↔ `scatter` ↔ `bubble` ↔ `heatmap` ↔ `treemap`

**Graphiques de plages** :
- `columnrange` ↔ `arearange` ↔ `areasplinerange`

#### Personnalisation des types disponibles

Vous pouvez limiter les types disponibles dans la toolbar avec l'attribut `[possibleType]` :

```html
<chart 
  [type]="chartType"
  [config]="chartConfig" 
  [data]="chartData"
  [possibleType]="['pie', 'donut', 'bar']">
</chart>
```

```typescript
export class MonComponent {
  chartType: ChartType = 'pie';
  chartConfig = {
    title: "Ventes par région",
    showToolbar: true,  // Active la toolbar
    series: [{ 
      data: { x: field("region"), y: field("ventes") },
      name: "Ventes" 
    }],
    options: {
      plotOptions: {
        series: {
          dataLabels: { enabled: true }
        }
      }
    }
  };
}
```

**Important** : Le type initial doit être inclus dans `[possibleType]`, sinon :
- Seul le type défini sera affiché
- La toolbar ne fonctionnera pas
- Un message d'erreur apparaîtra dans la console

**Exemples valides** :
```html
<!-- Type initial 'pie' inclus dans possibleType -->
<chart 
  [type]="'pie'"
  [possibleType]="['pie', 'donut', 'bar']"
  [config]="config" 
  [data]="data">
</chart>

<!-- Navigation limitée aux graphiques polaires -->
<chart 
  [type]="'radar'"
  [possibleType]="['radar', 'polar', 'radarArea']"
  [config]="config" 
  [data]="data">
</chart>

<!-- Graphiques de plages uniquement -->
<chart 
  [type]="'columnrange'"
  [possibleType]="['columnrange', 'arearange', 'areasplinerange']"
  [config]="config" 
  [data]="rangeData">
</chart>
```

**Exemple invalide** :
```html
<!-- Type initial 'pie' absent de possibleType -->
<chart 
  [type]="'pie'"
  [possibleType]="['bar', 'line']"  
  [config]="config" 
  [data]="data">
</chart>
<!-- Erreur en console, toolbar désactivée -->
```

#### Transitions intelligentes

La bibliothèque gère automatiquement les transitions spécifiques :

**Transition pie ↔ donut** :
```typescript
// Passage automatique de pie vers donut
// L'innerSize sera automatiquement mis à jour vers '50%'

// Passage automatique de donut vers pie  
// L'innerSize sera automatiquement remis à 0
```

**Transition radar ↔ polar** :
```typescript
// Les configurations d'axes polaires sont préservées
// Les propriétés spécifiques sont automatiquement adaptées
```

#### Exemple complet avec toolbar

```html
<div class="chart-container">
  <h3>{{ currentType | titlecase }} - {{ config.title }}</h3>
  <chart 
    [type]="currentType"
    [config]="config"
    [data]="salesData"
    [possibleType]="allowedTypes">
  </chart>
  <p>Type actuel : {{ currentType }}</p>
</div>
```

```typescript
@Component({
  template: `...` // Template ci-dessus
})
export class InteractiveChartComponent {
  currentType: ChartType = 'pie';
  allowedTypes: ChartType[] = ['pie', 'donut', 'bar', 'line', 'polar', 'radar'];
  
  config = {
    title: "Ventes par trimestre",
    showToolbar: true,  // Active la toolbar interactive
    series: [{
      data: { x: field("trimestre"), y: field("ventes") },
      name: "Ventes 2024"
    }],
    options: {
      plotOptions: {
        series: {
          // Configuration unique qui s'adapte à tous les types
          dataLabels: {
            enabled: true,
            format: '{point.y:,.0f}€'
          },
          borderWidth: 1,
          borderColor: '#ffffff'
        }
      }
    }
  };
  
  salesData = [
    { trimestre: "Q1", ventes: 125000 },
    { trimestre: "Q2", ventes: 180000 },
    { trimestre: "Q3", ventes: 165000 },
    { trimestre: "Q4", ventes: 220000 }
  ];
}
```

#### Personnalisation de la toolbar

La toolbar s'adapte automatiquement :
- **Position** : Se place intelligemment selon la présence du bouton d'export Highcharts
- **Visibilité** : Apparaît au survol, disparaît quand la souris quitte le graphique
- **Style** : S'harmonise avec le thème du graphique

### Configuration du chargement et des états vides

La bibliothèque permet de personnaliser l'affichage pendant le chargement des données et lorsqu'aucune donnée n'est disponible via la propriété `[loadingConfig]`.

#### Utilisation de base

```html
<chart 
  type="line" 
  [config]="maConfig" 
  [data]="mesDonnees"
  [loadingConfig]="maConfigLoading">
</chart>
```

#### Configuration complète

```typescript
maConfigLoading = {
  
  // ÉTATS DE CHARGEMENT //
  
  // Texte affiché pendant le chargement (défaut: 'Chargement des données...')
  text: 'Patientez...',
  
  // Afficher le texte de chargement (défaut: true)
  showText: true,
  
  // Afficher le spinner de chargement (défaut: false)
  showSpinner: true,
  
  // Couleurs personnalisées pour le chargement
  backgroundColor: '#ffffff',    // Fond de l'écran de chargement
  textColor: '#666666',          // Couleur du texte
  spinnerColor: '#0066cc',       // Couleur du spinner
  
  // ÉTATS "AUCUNE DONNÉE" //
  
  // Message affiché quand aucune donnée n'est disponible (défaut: 'Aucune donnée disponible')
  noDataMessage: 'Aucune donnée trouvée',
  
  // Afficher un arrière-plan avec bordure pour l'état vide (défaut: false)
  showNoDataBackground: true,
  
  // Couleurs personnalisées pour l'état "aucune donnée"
  noDataBackgroundColor: '#f8f9fa',  // Couleur de fond
  noDataBorderColor: '#ddd',          // Couleur de la bordure
  noDataTextColor: '#666666',         // Couleur du texte
  
  // Afficher une icône (défaut: false)
  showNoDataIcon: true,
  
  // Personnaliser l'icône affichée (défaut: 'Chart')
  noDataIcon: 'Data'
};
```

#### Exemples d'utilisation courante

**Configuration minimaliste :**
```typescript
loadingConfig = {
  noDataMessage: 'Pas de données à afficher'
};
```

**Avec arrière-plan personnalisé :**
```typescript
loadingConfig = {
  showNoDataBackground: true,
  noDataBorderColor: '#e74c3c',
  noDataBackgroundColor: '#fff5f5'
};
```

**Avec icône personnalisée :**
```typescript
loadingConfig = {
  showNoDataIcon: true,
  noDataIcon: '🔍',
  noDataMessage: 'Aucune donnée trouvée'
};
```

**Style sombre :**
```typescript
loadingConfig = {
  backgroundColor: '#2c3e50',
  textColor: '#ffffff',
  noDataBackgroundColor: '#34495e',
  noDataTextColor: '#ffffff',
  spinnerColor: '#3498db'
};
```

#### Propriétés complètes

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `text` | `string` | `'Chargement des données...'` | Texte affiché pendant le chargement |
| `showText` | `boolean` | `true` | Afficher ou masquer le texte de chargement |
| `showSpinner` | `boolean` | `false` | Afficher ou masquer le spinner |
| `backgroundColor` | `string` | `'#ffffff'` | Couleur de fond de l'écran de chargement |
| `textColor` | `string` | `'#666666'` | Couleur du texte de chargement |
| `spinnerColor` | `string` | `'#0066cc'` | Couleur du spinner |
| `noDataMessage` | `string` | `'Aucune donnée disponible'` | Message affiché quand aucune donnée |
| `showNoDataBackground` | `boolean` | `false` | Afficher un arrière-plan pour l'état vide |
| `noDataBackgroundColor` | `string` | `'#f8f9fa'` | Couleur de fond de l'état vide |
| `noDataBorderColor` | `string` | `'#ddd'` | Couleur de bordure de l'état vide |
| `noDataTextColor` | `string` | `'#666666'` | Couleur du texte de l'état vide |
| `showNoDataIcon` | `boolean` | `false` | Afficher une icône dans l'état vide |
| `noDataIcon` | `string` | `'📊'` | Icône à afficher (emoji ou texte) |

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

## Compatibilité et migration

### Migration vers le système unifié

Si vous utilisiez auparavant des configurations spécifiques à chaque type de graphique, vous pouvez maintenant simplifier votre code :

#### Avant (ancien système)
```typescript
// Configuration répétitive pour chaque type
const configPie = {
  options: {
    plotOptions: {
      pie: {
        dataLabels: { enabled: true },
        borderWidth: 2
      }
    }
  }
};

const configBar = {
  options: {
    plotOptions: {
      bar: {
        dataLabels: { enabled: true },
        borderWidth: 2
      }
    }
  }
};
```

#### Après (système unifié)
```typescript
// Configuration unique réutilisable
const configUnifiee = {
  options: {
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
        borderWidth: 2
      }
    }
  }
};
```

### Rétrocompatibilité

Le système unifié est **100% rétrocompatible**. Vos configurations existantes continueront de fonctionner :

```typescript
// Continue de fonctionner
const ancienneConfig = {
  options: {
    plotOptions: {
      pie: {
        dataLabels: { enabled: true }
      }
    }
  }
};

// Nouvelle syntaxe recommandée
const nouvelleConfig = {
  options: {
    plotOptions: {
      series: {
        dataLabels: { enabled: true }  // Sera transformé vers pie.dataLabels
      }
    }
  }
};
```

### Avantages de la migration

1. **Code plus maintenable** : Une seule configuration pour tous les types
2. **Réutilisabilité** : Mêmes configurations utilisables sur différents types
3. **Simplicité** : Moins de duplication de code
4. **Flexibilité** : Changement de type sans modification de configuration

## License

Ce package est fourni sous licence Apache 2.0, mais veuillez noter que **Highcharts** nécessite une licence commerciale pour une utilisation professionnelle.

La documentation complète de Highcharts est disponible sur [leur site officiel](https://www.highcharts.com/docs/index).
