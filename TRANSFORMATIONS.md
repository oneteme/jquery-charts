# Transformations Intelligentes des Données de Graphiques

**jquery-highcharts** - Documentation Technique

---

## Table des matières

1. [Introduction](#introduction)
2. [Principe général des transformations](#principe-général-des-transformations)
3. [Graphiques Simples vs Complexes](#graphiques-simples-vs-complexes)
4. [Graphiques Range](#graphiques-range)
5. [Graphiques Bubble](#graphiques-bubble)
6. [Graphiques Heatmap](#graphiques-heatmap)
7. [Graphiques Treemap](#graphiques-treemap)
8. [Graphiques Polaires](#graphiques-polaires)
9. [Système de mémoire](#système-de-mémoire)
10. [Compatibilité entre types](#compatibilité-entre-types)

---

## Introduction

La bibliothèque jquery-highcharts implémente un système de transformations intelligentes et bidirectionnelles pour convertir automatiquement les données entre différents formats de graphiques. Ce système permet à l'utilisateur de switcher entre types de graphiques sans modifier ses données source.

### Objectifs

- **Transparence** : L'utilisateur fournit des données au format simple (x, y) et la bibliothèque les adapte automatiquement
- **Bidirectionnalité** : Les transformations fonctionnent dans les deux sens (format spécial ↔ format standard)
- **Préservation** : Les données originales sont conservées en mémoire pour permettre les conversions inverses sans perte
- **Automatisation** : Détection automatique du format des données et choix de la stratégie de transformation appropriée

---

## Principe général des transformations

### Format standard

Les graphiques standards (line, bar, column, area) utilisent un format de données simple :

```typescript
{
  series: [
    {
      name: "Série 1",
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
      ],
    },
    {
      name: "Série 2",
      data: [
        { x: 0, y: 8 },
        { x: 1, y: 18 },
        { x: 2, y: 12 },
      ],
    },
  ];
}
```

### Formats spéciaux

Certains types de graphiques nécessitent des formats de données spécifiques. La bibliothèque détecte automatiquement ces formats et applique les transformations nécessaires.

---

## Graphiques Simples vs Complexes

### Graphiques simples (name/value)

**Types concernés :** `pie`, `donut`, `funnel`, `pyramid`

Les graphiques simples utilisent un format de données ultra-simplifié avec uniquement un nom et une valeur :

```typescript
{
  series: [
    {
      name: "Données",
      data: [
        { name: "Catégorie A", y: 100 },
        { name: "Catégorie B", y: 150 },
        { name: "Catégorie C", y: 80 },
        { name: "Catégorie D", y: 120 },
      ],
    },
  ];
}
```

**Format encore plus simple possible :**

```typescript
// L'utilisateur peut fournir directement un tableau de valeurs
data = [
  { name: "Ventes Q1", value: 100 },
  { name: "Ventes Q2", value: 150 },
  { name: "Ventes Q3", value: 80 },
  { name: "Ventes Q4", value: 120 },
];
```

### Transformation simple → complexe

Lorsqu'un utilisateur switche d'un graphique simple (pie) vers un graphique complexe (line, bar, etc.), la bibliothèque convertit automatiquement les données `{name, y}` en format `{x, y}` avec catégories.

**Données source (pie) :**

```typescript
[
  {
    name: "Total Ventes",
    data: [
      { name: "T1", y: 100 },
      { name: "T2", y: 150 },
      { name: "T3", y: 80 },
      { name: "T4", y: 120 },
    ],
  },
];
```

**Algorithme de transformation :**

1. **Extraction des catégories** : Les `name` des points deviennent les catégories de l'axe X

   ```typescript
   categories = data.map((point, index) => point.name || `Catégorie ${index + 1}`);
   // Résultat: ["T1", "T2", "T3", "T4"]
   ```

2. **Création des points (x, y)** : Chaque point reçoit un index X basé sur sa position
   ```typescript
   data.map((point, index) => ({
     x: index, // Index numérique
     y: point.y, // Valeur conservée
     name: point.name, // Nom préservé optionnellement
   }));
   ```

**Données transformées (line/bar) :**

```typescript
{
  series: [
    {
      name: "Total Ventes",
      data: [
        { x: 0, y: 100, name: "T1" },
        { x: 1, y: 150, name: "T2" },
        { x: 2, y: 80, name: "T3" },
        { x: 3, y: 120, name: "T4" }
      ]
    }
  ],
  xAxis: {
    categories: ["T1", "T2", "T3", "T4"]
  }
}
```

### Transformation complexe → simple

Lorsqu'un utilisateur switche d'un graphique complexe vers un graphique simple, deux scénarios sont possibles :

#### Scénario 1 : Une seule série

**Données source (line - une série) :**

```typescript
{
  series: [
    {
      name: "Évolution",
      data: [
        { x: 0, y: 100 },
        { x: 1, y: 150 },
        { x: 2, y: 80 }
      ]
    }
  ],
  xAxis: {
    categories: ["Jan", "Fév", "Mar"]
  }
}
```

**Transformation :**

- Conversion directe : utiliser les données telles quelles
- Récupérer les noms depuis les catégories si disponibles

**Données transformées (pie) :**

```typescript
{
  series: [
    {
      name: "Évolution",
      data: [
        { name: "Jan", y: 100 },
        { name: "Fév", y: 150 },
        { name: "Mar", y: 80 },
      ],
    },
  ];
}
```

#### Scénario 2 : Plusieurs séries

**Données source (line - plusieurs séries) :**

```typescript
{
  series: [
    {
      name: "Série A",
      data: [
        { x: 0, y: 100 },
        { x: 1, y: 150 },
        { x: 2, y: 80 },
      ],
    },
    {
      name: "Série B",
      data: [
        { x: 0, y: 120 },
        { x: 1, y: 90 },
        { x: 2, y: 110 },
      ],
    },
    {
      name: "Série C",
      data: [
        { x: 0, y: 80 },
        { x: 1, y: 130 },
        { x: 2, y: 95 },
      ],
    },
  ];
}
```

**Algorithme d'agrégation :**

1. **Calcul de la somme par série** : Pour chaque série, sommer toutes les valeurs Y

   ```typescript
   series.map((serie) => {
     const sum = serie.data.reduce((total, point) => total + point.y, 0);
     return {
       name: serie.name,
       y: sum,
     };
   });
   ```

2. **Création d'une série unique** : Chaque série devient une part du graphique simple

**Données transformées (pie) :**

```typescript
{
  series: [
    {
      name: "Total",
      data: [
        { name: "Série A", y: 330 }, // 100 + 150 + 80
        { name: "Série B", y: 320 }, // 120 + 90 + 110
        { name: "Série C", y: 305 }, // 80 + 130 + 95
      ],
    },
  ];
}
```

### Code de transformation

```typescript
/** Transforme les données multi-séries pour les graphiques simples */
export function transformDataForSimpleChart(chartData: { series: any[]; xAxis?: any }, config: ChartProvider): any[] {
  const { series, xAxis } = chartData;
  const categories = xAxis?.categories;

  // Si plusieurs séries → agréger
  if (series && series.length > 1) {
    return series.map((serie) => {
      if (!serie.data || serie.data.length === 0) {
        return { name: serie.name || "Série", y: 0 };
      }

      const sum = serie.data.reduce((total: number, dataPoint: any) => {
        const value = typeof dataPoint === "object" ? (dataPoint.y !== undefined ? dataPoint.y : dataPoint) : dataPoint;
        return total + (value || 0);
      }, 0);

      return {
        name: serie.name || "Série",
        y: sum,
      };
    });
  }

  // Si une seule série → utiliser directement
  return series[0]?.data || [];
}
```

### Compatibilité bidirectionnelle

| Direction                    | Format source | Format cible          | Transformation    | Perte d'info                    |
| ---------------------------- | ------------- | --------------------- | ----------------- | ------------------------------- |
| Simple → Complexe            | `{name, y}`   | `{x, y}` + categories | Index automatique | ❌ Non                          |
| Complexe → Simple (1 série)  | `{x, y}`      | `{name, y}`           | Direct            | ❌ Non                          |
| Complexe → Simple (N séries) | `{x, y}` × N  | `{name, y}` × N       | Agrégation        | ⚠️ Valeurs détaillées perdues\* |

**\* Note** : Lors de l'agrégation multi-séries, seules les sommes sont conservées. Les valeurs individuelles de chaque point X sont perdues, mais cette transformation est logique pour les graphiques simples qui ne peuvent afficher qu'une dimension.

### Exemple de flux complet

**Scénario** : L'utilisateur passe de `pie` → `line` → `bubble` → `pie`

1. **pie → line**

   - Format actuel : `[{name: "A", y: 100}, {name: "B", y: 150}]`
   - Transformation : Création d'index X `[{x: 0, y: 100}, {x: 1, y: 150}]`
   - Catégories : `["A", "B"]` extraites des names
   - ✅ Aucune perte

2. **line → bubble**

   - Format actuel : `{x, y}` standard
   - Transformation : Ajout de z calculé depuis y
   - Résultat : `{x, y, z}` avec z basé sur la normalisation de y
   - ✅ Aucune perte (données originales en mémoire)

3. **bubble → pie**
   - Format actuel : `{x, y, z}`
   - Transformation inverse : Retour au format standard `{x, y}` (via mémoire)
   - Puis conversion simple : Utilisation des catégories pour recréer les names
   - Résultat : `[{name: "A", y: 100}, {name: "B", y: 150}]`
   - ✅ Aucune perte (grâce au système de mémoire)

---

## Graphiques Range

**Types concernés :** `columnrange`, `arearange`, `areasplinerange`

### Format attendu par Highcharts

Les graphiques range nécessitent des plages de valeurs (minimum et maximum) :

```typescript
{
  series: [
    {
      name: "Température",
      data: [
        { x: 0, low: 5, high: 15 }, // ou [0, 5, 15]
        { x: 1, low: 7, high: 18 }, // ou [1, 7, 18]
        { x: 2, low: 6, high: 16 }, // ou [2, 6, 16]
      ],
    },
  ];
}
```

### Stratégies de transformation

La bibliothèque implémente **5 stratégies automatiques** pour transformer des données standard (x, y) vers le format range :

#### Stratégie 1 : Multiple Séries Min/Max

**Cas d'usage :** Plusieurs séries où l'on veut afficher l'intervalle entre min et max de toutes les séries pour chaque point X.

**Données source :**

```typescript
[
  {
    name: "Série 1",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
    ],
  },
  {
    name: "Série 2",
    data: [
      { x: 0, y: 8 },
      { x: 1, y: 18 },
    ],
  },
  {
    name: "Série 3",
    data: [
      { x: 0, y: 12 },
      { x: 1, y: 22 },
    ],
  },
];
```

**Transformation :**

- Pour chaque valeur X, calculer le minimum et maximum de toutes les séries
- Créer une série unique avec les plages [x, min, max]

**Données transformées :**

```typescript
[
  {
    name: "Plage de valeurs",
    data: [
      { x: 0, low: 8, high: 12 }, // min(10,8,12)=8, max(10,8,12)=12
      { x: 1, low: 18, high: 22 }, // min(20,18,22)=18, max(20,18,22)=22
    ],
  },
];
```

**Transformation inverse :**

- Impossible de récupérer les séries individuelles
- Utilise les données sauvegardées en mémoire (Symbol ORIGINAL_DATA_SYMBOL)

---

#### Stratégie 2 : Série unique par paires

**Cas d'usage :** Une seule série où les points sont organisés par paires consécutives (point 1 = low, point 2 = high).

**Données source :**

```typescript
[
  {
    name: "Températures",
    data: [
      { x: 0, y: 5 }, // low pour x=0
      { x: 0, y: 15 }, // high pour x=0
      { x: 1, y: 7 }, // low pour x=1
      { x: 1, y: 18 }, // high pour x=1
      { x: 2, y: 6 }, // low pour x=2
      { x: 2, y: 16 }, // high pour x=2
    ],
  },
];
```

**Transformation :**

- Grouper les points par paires
- Pour chaque paire, créer un point range avec [x, min(y1, y2), max(y1, y2)]

**Données transformées :**

```typescript
[
  {
    name: "Températures",
    data: [
      { x: 0, low: 5, high: 15 },
      { x: 1, low: 7, high: 18 },
      { x: 2, low: 6, high: 16 },
    ],
  },
];
```

**Transformation inverse :**

- Décomposer chaque point range en deux points simples
- Reconstituer la série avec tous les points

---

#### Stratégie 3 : Série unique par groupes de X

**Cas d'usage :** Une seule série où plusieurs points partagent la même valeur X (groupe de points).

**Données source :**

```typescript
[
  {
    name: "Mesures",
    data: [
      { x: 0, y: 8 },
      { x: 0, y: 10 },
      { x: 0, y: 12 },
      { x: 1, y: 18 },
      { x: 1, y: 20 },
      { x: 1, y: 22 },
    ],
  },
];
```

**Transformation :**

- Grouper les points par valeur X
- Pour chaque groupe, calculer min et max des valeurs Y

**Données transformées :**

```typescript
[
  {
    name: "Mesures",
    data: [
      { x: 0, low: 8, high: 12 }, // min(8,10,12)=8, max(8,10,12)=12
      { x: 1, low: 18, high: 22 }, // min(18,20,22)=18, max(18,20,22)=22
    ],
  },
];
```

**Transformation inverse :**

- Impossible de récupérer les valeurs intermédiaires
- Utilise les données sauvegardées en mémoire

---

#### Stratégie 4 : Comparer deux séries

**Cas d'usage :** Exactement deux séries que l'on veut comparer en affichant l'intervalle entre elles.

**Données source :**

```typescript
[
  {
    name: "Minimum",
    data: [
      { x: 0, y: 5 },
      { x: 1, y: 7 },
    ],
  },
  {
    name: "Maximum",
    data: [
      { x: 0, y: 15 },
      { x: 1, y: 18 },
    ],
  },
];
```

**Transformation :**

- Pour chaque point X, prendre la valeur Y de chaque série
- Créer un point range avec [x, min(y1, y2), max(y1, y2)]

**Données transformées :**

```typescript
[
  {
    name: "Minimum - Maximum",
    data: [
      { x: 0, low: 5, high: 15 },
      { x: 1, low: 7, high: 18 },
    ],
  },
];
```

**Transformation inverse :**

- Recréer deux séries à partir des valeurs low et high
- Nommer les séries avec les noms originaux sauvegardés en mémoire

---

#### Stratégie 5 : Auto-détection

**Cas d'usage :** Mode automatique qui choisit la meilleure stratégie selon la structure des données.

**Logique de décision :**

1. **Si exactement 2 séries** → Stratégie 4 (Comparer deux séries)
2. **Sinon si 1 seule série :**
   - Si les valeurs X se répètent → Stratégie 3 (Groupes de X)
   - Sinon → Stratégie 2 (Par paires)
3. **Sinon (3+ séries)** → Stratégie 1 (Multiple séries Min/Max)

**Code de détection :**

```typescript
export function autoTransform(series: any[]): any[] {
  if (series.length === 2) {
    return compareTwoSeries(series);
  } else if (series.length === 1) {
    const xValues = series[0].data.map((p: any) => p.x);
    const hasDuplicates = xValues.some((x: any, i: number) => xValues.indexOf(x) !== i);

    if (hasDuplicates) {
      return groupByXValue(series);
    } else {
      return singleSeriesByPairs(series);
    }
  }

  return multipleSeriesMinMax(series);
}
```

### Configuration utilisée

```typescript
export function configureRangeChart(options: Highcharts.Options, chartType: string): void {
  // Configuration des options Highcharts pour range
  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  (options.plotOptions as any).columnrange = {
    ...(options.plotOptions as any).columnrange,
    grouping: true,
    dataLabels: { enabled: false },
  };
}
```

---

## Graphiques Bubble

**Types concernés :** `bubble`

### Format attendu par Highcharts

Les graphiques bubble nécessitent trois dimensions : x, y, et z (taille de la bulle) :

```typescript
{
  series: [
    {
      name: "Série 1",
      data: [
        { x: 0, y: 10, z: 50 }, // ou [0, 10, 50]
        { x: 1, y: 20, z: 30 },
        { x: 2, y: 15, z: 70 },
      ],
    },
  ];
}
```

### Transformation standard → bubble

**Données source (format standard) :**

```typescript
[
  {
    name: "Ventes",
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 200 },
      { x: 2, y: 150 },
    ],
  },
];
```

**Algorithme de transformation :**

1. **Normalisation** : Pour chaque série, calculer min et max des valeurs Y
2. **Calcul de z** : Pour chaque point, calculer la taille de la bulle :
   ```typescript
   normalized = (y - min) / (max - min); // Valeur entre 0 et 1
   z = Math.max(1, Math.sqrt(normalized) * 50);
   ```
3. **Application de sqrt** : L'utilisation de la racine carrée permet d'adoucir les différences de taille pour une meilleure lisibilité visuelle

**Données transformées :**

```typescript
[
  {
    name: "Ventes",
    data: [
      { x: 0, y: 100, z: 1 }, // min → z=1 (taille minimale)
      { x: 1, y: 200, z: 50 }, // max → z=50 (taille maximale)
      { x: 2, y: 150, z: 35.35 }, // milieu → z≈35
    ],
  },
];
```

### Transformation bubble → standard

**Données source (format bubble) :**

```typescript
[
  {
    name: "Données",
    data: [
      { x: 0, y: 100, z: 50 },
      { x: 1, y: 200, z: 30 },
    ],
  },
];
```

**Algorithme de transformation :**

1. **Suppression de z** : Retirer simplement la propriété `z` de chaque point
2. **Conservation** : Garder x et y tels quels

**Données transformées :**

```typescript
[
  {
    name: "Données",
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 200 },
    ],
  },
];
```

### Configuration utilisée

```typescript
export function configureBubbleChart(options: Highcharts.Options, chartType: string): void {
  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  (options.plotOptions as any).bubble = {
    ...(options.plotOptions as any).bubble,
    minSize: 5, // Taille minimale des bulles (pixels)
    maxSize: 50, // Taille maximale des bulles (pixels)
    dataLabels: { enabled: false },
  };
}
```

**Note importante :** Les tailles min/max (5-50 pixels) ont été optimisées pour éviter des bulles trop grandes qui rendraient le graphique illisible.

---

## Graphiques Heatmap

**Types concernés :** `heatmap`

### Format attendu par Highcharts

Les graphiques heatmap utilisent une structure de matrice avec coordonnées X, Y et valeur :

```typescript
{
  series: [
    {
      name: "Données",
      data: [
        [0, 0, 10],  // [xIndex, yIndex, value]
        [1, 0, 20],
        [2, 0, 30],
        [0, 1, 15],
        [1, 1, 25],
        [2, 1, 35]
      ]
    }
  ],
  yAxis: {
    categories: ["Série A", "Série B"]  // Labels de l'axe Y
  }
}
```

### Transformation standard → heatmap

**Données source (format standard - plusieurs séries) :**

```typescript
[
  {
    name: "Série A",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
    ],
  },
  {
    name: "Série B",
    data: [
      { x: 0, y: 15 },
      { x: 1, y: 25 },
      { x: 2, y: 35 },
    ],
  },
];
```

**Algorithme de transformation :**

1. **Extraction des catégories Y** : Récupérer les noms des séries pour l'axe Y

   ```typescript
   yCategories = series.map((s) => s.name); // ["Série A", "Série B"]
   ```

2. **Conversion en matrice** : Pour chaque série (index yIndex), convertir chaque point :

   ```typescript
   // Pour chaque série
   series.forEach((serie, yIndex) => {
     // Pour chaque point de la série
     serie.data.forEach((point) => {
       heatmapData.push([
         point.x, // Index X (colonne)
         yIndex, // Index Y (ligne = index de la série)
         point.y, // Valeur (couleur de la cellule)
       ]);
     });
   });
   ```

3. **Création de la série unique** : Rassembler tous les points dans une seule série

**Données transformées :**

```typescript
{
  series: [
    {
      name: "Heatmap",
      data: [
        [0, 0, 10],  // x=0, série A (y=0), valeur=10
        [1, 0, 20],  // x=1, série A (y=0), valeur=20
        [2, 0, 30],  // x=2, série A (y=0), valeur=30
        [0, 1, 15],  // x=0, série B (y=1), valeur=15
        [1, 1, 25],  // x=1, série B (y=1), valeur=25
        [2, 1, 35]   // x=2, série B (y=1), valeur=35
      ]
    }
  ],
  yCategories: ["Série A", "Série B"]
}
```

### Transformation heatmap → standard

**Données source (format heatmap) :**

```typescript
{
  series: [
    {
      data: [
        [0, 0, 10],
        [1, 0, 20],
        [0, 1, 15],
        [1, 1, 25]
      ]
    }
  ],
  metadata: {
    yCategories: ["Catégorie A", "Catégorie B"]
  }
}
```

**Algorithme de transformation :**

1. **Regroupement par Y** : Grouper les points par leur index Y (ligne)

   ```typescript
   const groups = new Map();
   data.forEach(([x, y, value]) => {
     if (!groups.has(y)) groups.set(y, []);
     groups.get(y).push({ x, y: value });
   });
   ```

2. **Création des séries** : Pour chaque groupe Y, créer une série
   ```typescript
   const series = [];
   groups.forEach((points, yIndex) => {
     series.push({
       name: yCategories[yIndex] || `Série ${yIndex + 1}`,
       data: points.sort((a, b) => a.x - b.x), // Trier par X
     });
   });
   ```

**Données transformées :**

```typescript
[
  {
    name: "Catégorie A",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
    ],
  },
  {
    name: "Catégorie B",
    data: [
      { x: 0, y: 15 },
      { x: 1, y: 25 },
    ],
  },
];
```

### Configuration utilisée

```typescript
export function configureHeatmapChart(options: Highcharts.Options, chartType: string): void {
  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  (options.plotOptions as any).heatmap = {
    ...(options.plotOptions as any).heatmap,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    dataLabels: {
      enabled: true,
      color: "#000000",
    },
  };

  // Configuration de l'échelle de couleurs
  if (!options.colorAxis) {
    options.colorAxis = {
      min: 0,
      minColor: "#FFFFFF",
      maxColor: Highcharts.getOptions().colors[0],
    };
  }
}
```

**Note importante :** Les catégories Y sont automatiquement extraites des noms de séries et appliquées à l'axe Y du graphique pour afficher les labels corrects.

---

## Graphiques Treemap

**Types concernés :** `treemap`

### Format attendu par Highcharts

Les graphiques treemap utilisent une structure hiérarchique avec des relations parent-enfant :

```typescript
{
  series: [
    {
      type: "treemap",
      data: [
        { id: "A", name: "Catégorie A", value: 100 },
        { id: "A1", parent: "A", name: "Sous A1", value: 40 },
        { id: "A2", parent: "A", name: "Sous A2", value: 60 },
        { id: "B", name: "Catégorie B", value: 200 },
        { id: "B1", parent: "B", name: "Sous B1", value: 80 },
        { id: "B2", parent: "B", name: "Sous B2", value: 120 },
      ],
    },
  ];
}
```

### Transformation standard → treemap

**Données source (format standard - plusieurs séries) :**

```typescript
[
  {
    name: "Ventes Q1",
    data: [
      { x: 0, y: 100, name: "Produit A" },
      { x: 1, y: 150, name: "Produit B" },
      { x: 2, y: 200, name: "Produit C" },
    ],
  },
  {
    name: "Ventes Q2",
    data: [
      { x: 0, y: 120, name: "Produit A" },
      { x: 1, y: 180, name: "Produit B" },
      { x: 2, y: 220, name: "Produit C" },
    ],
  },
];
```

**Algorithme de transformation :**

1. **Création de la racine** : Calculer la valeur totale de toutes les séries

   ```typescript
   const total = series.reduce((sum, s) => sum + s.data.reduce((s2, p) => s2 + p.y, 0), 0);

   treemapData.push({
     id: "root",
     name: "Total",
     value: total,
   });
   ```

2. **Création des groupes** : Pour chaque série, créer un nœud parent

   ```typescript
   series.forEach((serie, serieIndex) => {
     const serieTotal = serie.data.reduce((sum, p) => sum + p.y, 0);

     treemapData.push({
       id: `serie_${serieIndex}`,
       parent: "root",
       name: serie.name,
       value: serieTotal,
     });
   });
   ```

3. **Création des feuilles** : Pour chaque point, créer un nœud enfant
   ```typescript
   series.forEach((serie, serieIndex) => {
     serie.data.forEach((point, pointIndex) => {
       treemapData.push({
         id: `serie_${serieIndex}_point_${pointIndex}`,
         parent: `serie_${serieIndex}`,
         name: point.name || categories[point.x] || `Point ${point.x}`,
         value: point.y,
       });
     });
   });
   ```

**Données transformées :**

```typescript
[
  {
    type: "treemap",
    data: [
      // Racine
      { id: "root", name: "Total", value: 970 },

      // Groupes (séries)
      { id: "serie_0", parent: "root", name: "Ventes Q1", value: 450 },
      { id: "serie_1", parent: "root", name: "Ventes Q2", value: 520 },

      // Feuilles (points)
      { id: "serie_0_point_0", parent: "serie_0", name: "Produit A", value: 100 },
      { id: "serie_0_point_1", parent: "serie_0", name: "Produit B", value: 150 },
      { id: "serie_0_point_2", parent: "serie_0", name: "Produit C", value: 200 },
      { id: "serie_1_point_0", parent: "serie_1", name: "Produit A", value: 120 },
      { id: "serie_1_point_1", parent: "serie_1", name: "Produit B", value: 180 },
      { id: "serie_1_point_2", parent: "serie_1", name: "Produit C", value: 220 },
    ],
  },
];
```

### Transformation treemap → standard

**Données source (format treemap) :**

```typescript
[
  {
    data: [
      { id: "root", name: "Total", value: 500 },
      { id: "A", parent: "root", name: "Groupe A", value: 200 },
      { id: "A1", parent: "A", name: "Item A1", value: 80 },
      { id: "A2", parent: "A", name: "Item A2", value: 120 },
      { id: "B", parent: "root", name: "Groupe B", value: 300 },
      { id: "B1", parent: "B", name: "Item B1", value: 150 },
      { id: "B2", parent: "B", name: "Item B2", value: 150 },
    ],
  },
];
```

**Algorithme de transformation :**

1. **Identification des niveaux** : Séparer les nœuds par niveau hiérarchique

   ```typescript
   const parents = data.filter((d) => d.parent === "root" || !d.parent);
   const children = data.filter((d) => d.parent && d.parent !== "root");
   ```

2. **Groupement par parent** : Regrouper les enfants par leur parent

   ```typescript
   const groupedByParent = new Map();
   children.forEach((child) => {
     if (!groupedByParent.has(child.parent)) {
       groupedByParent.set(child.parent, []);
     }
     groupedByParent.get(child.parent).push(child);
   });
   ```

3. **Création des séries** : Pour chaque groupe parent, créer une série

   ```typescript
   const series = [];
   parents.forEach((parent, index) => {
     const childNodes = groupedByParent.get(parent.id) || [];

     series.push({
       name: parent.name,
       data: childNodes.map((child, i) => ({
         x: i,
         y: child.value,
         name: child.name,
       })),
     });
   });
   ```

**Données transformées :**

```typescript
[
  {
    name: "Groupe A",
    data: [
      { x: 0, y: 80, name: "Item A1" },
      { x: 1, y: 120, name: "Item A2" },
    ],
  },
  {
    name: "Groupe B",
    data: [
      { x: 0, y: 150, name: "Item B1" },
      { x: 1, y: 150, name: "Item B2" },
    ],
  },
];
```

### Configuration utilisée

```typescript
export function configureTreemapChart(options: Highcharts.Options, chartType: string): void {
  if (!options.plotOptions) {
    options.plotOptions = {};
  }

  (options.plotOptions as any).treemap = {
    ...(options.plotOptions as any).treemap,
    layoutAlgorithm: "squarified",
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontWeight: "bold",
      },
    },
    levels: [
      {
        level: 1,
        borderWidth: 3,
        borderColor: "#FFFFFF",
        dataLabels: {
          enabled: true,
          align: "left",
          verticalAlign: "top",
          style: {
            fontSize: "15px",
            fontWeight: "bold",
          },
        },
      },
    ],
  };
}
```

---

## Graphiques Polaires

**Types concernés :** `polar`, `radar`, `radarArea`, `radialBar`

### Particularités

Les graphiques polaires n'ont **pas de transformation de données spécifique**. Ils utilisent le format standard (x, y) mais avec des configurations visuelles particulières.

### Format de données

```typescript
{
  series: [
    {
      name: "Compétences",
      data: [
        { x: 0, y: 7 },   // Catégorie 0 : valeur 7
        { x: 1, y: 8 },   // Catégorie 1 : valeur 8
        { x: 2, y: 6 },   // Catégorie 2 : valeur 6
        { x: 3, y: 9 }    // Catégorie 3 : valeur 9
      ]
    }
  ],
  xAxis: {
    categories: ["Communication", "Technique", "Gestion", "Leadership"]
  }
}
```

### Configurations spécifiques par type

#### RadialBar

Configuration particulière pour afficher les barres en cercles concentriques :

```typescript
export function configureRadialBarType(options: Highcharts.Options): void {
  // Configuration du graphique
  options.chart = {
    ...options.chart,
    polar: true,
    inverted: true, // Essentiel pour l'affichage radial
  };

  // Configuration de l'axe X (circulaire)
  options.xAxis = {
    ...options.xAxis,
    tickInterval: 1,
    labels: {
      align: "right",
      useHTML: false,
      allowOverlap: false,
      step: 1,
      y: 3,
      style: { fontSize: "13px" },
    },
    lineWidth: 0,
    gridLineWidth: 0,
  };

  // Configuration de l'axe Y (radial)
  options.yAxis = {
    ...options.yAxis,
    crosshair: { enabled: true, color: "#333" },
    lineWidth: 0,
    tickInterval: 2,
    reversedStacks: false,
    endOnTick: true,
    showLastLabel: false, // Évite le label du dernier tick
    gridLineWidth: 0,
  };

  // Configuration des barres
  options.plotOptions = {
    ...options.plotOptions,
    series: {
      stacking: "normal",
      pointPlacement: "on", // Aligne les données sur les ticks
    },
    column: {
      pointPadding: 0,
      groupPadding: 0,
      borderWidth: 2,
      pointPlacement: "on",
    },
  };
}
```

**Points clés pour radialBar :**

- `inverted: true` : Indispensable pour l'affichage radial correct
- `showLastLabel: false` : Évite l'affichage du label du dernier tick qui peut chevaucher le premier
- `pointPlacement: 'on'` : Aligne précisément les données sur les graduations

#### Polar, Radar, RadarArea

Configuration générique pour les autres types polaires :

```typescript
export function configurePolarChart(options: Highcharts.Options, chartType: string): void {
  options.chart = {
    ...options.chart,
    polar: true,
  };

  options.xAxis = {
    ...options.xAxis,
    tickmarkPlacement: "on",
    lineWidth: 0,
  };

  options.yAxis = {
    ...options.yAxis,
    gridLineInterpolation: "polygon", // Grille polygonale pour radar
    lineWidth: 0,
    min: 0,
  };
}
```

---

## Système de mémoire

### Principe

Pour permettre les transformations bidirectionnelles sans perte d'information, la bibliothèque utilise un système de **Symbols JavaScript** pour stocker les données originales directement dans les objets transformés.

### Symbols utilisés

```typescript
const ORIGINAL_DATA_SYMBOL = Symbol("originalData");
const ORIGINAL_METADATA_SYMBOL = Symbol("originalMetadata");
```

### Sauvegarde des données

Lors d'une transformation vers un format spécial, les données originales sont sauvegardées :

```typescript
// Exemple pour bubble
export function transformToBubble(series: any[]): any[] {
  const transformed = series.map((serie) => ({
    name: serie.name,
    data: serie.data.map((point) => {
      // Calcul de z...
      return { x: point.x, y: point.y, z: calculatedZ };
    }),
  }));

  // Sauvegarde des données originales
  if (transformed[0]?.data) {
    transformed[0].data[ORIGINAL_DATA_SYMBOL] = series;
  }

  return transformed;
}
```

### Restauration des données

Lors d'une transformation inverse, les données originales sont récupérées :

```typescript
export function transformFromBubble(series: any[]): any[] {
  // Tenter de récupérer les données originales
  const firstDataArray = series[0]?.data;
  if (firstDataArray && firstDataArray[ORIGINAL_DATA_SYMBOL]) {
    return firstDataArray[ORIGINAL_DATA_SYMBOL];
  }

  // Sinon, transformation simple (perte de précision possible)
  return series.map((serie) => ({
    name: serie.name,
    data: serie.data.map((point) => ({ x: point.x, y: point.y })),
  }));
}
```

### Métadonnées supplémentaires

Pour certains types (heatmap), des métadonnées additionnelles sont sauvegardées :

```typescript
// Sauvegarde des catégories Y pour heatmap
if (transformed[0]?.data) {
  transformed[0].data[ORIGINAL_DATA_SYMBOL] = series;
  transformed[0].data[ORIGINAL_METADATA_SYMBOL] = {
    yCategories: series.map((s) => s.name),
  };
}

// Récupération
const metadata = firstDataArray[ORIGINAL_METADATA_SYMBOL];
const yCategories = metadata?.yCategories || [];
```

### Avantages

1. **Transparence** : Les Symbols ne sont pas énumérables, ils n'interfèrent pas avec les itérations normales
2. **Unicité** : Garantie d'absence de conflits de noms avec d'autres propriétés
3. **Performance** : Référence directe sans copie profonde
4. **Préservation parfaite** : Aucune perte d'information lors des transformations multiples

---

## Compatibilité entre types

### Détection automatique du format

Le système détecte automatiquement le format actuel des données avant de les transformer :

```typescript
export function needsDataConversion(series: any[], targetType: ChartType): boolean {
  // Détection range
  const hasRange = series.some((s) => s.data?.some((p: any) => (Array.isArray(p) && p.length >= 3) || (p && typeof p === "object" && ("low" in p || "high" in p))));

  // Détection bubble
  const hasBubble = series.some((s) => s.data?.some((p: any) => (Array.isArray(p) && p.length >= 3) || (p && typeof p === "object" && "z" in p)));

  // Détection heatmap
  const hasHeatmap = series.some((s) => s.data?.some((p: any) => Array.isArray(p) && p.length === 3));

  // Détection treemap
  const hasTreemap = series.some((s) => s.data?.some((p: any) => p && typeof p === "object" && ("parent" in p || "id" in p)));

  // Vérifier si une conversion est nécessaire
  if (hasRange && !isRangeChart(targetType)) return true;
  if (hasBubble && !isBubbleChart(targetType)) return true;
  if (hasHeatmap && !isHeatmapChart(targetType)) return true;
  if (hasTreemap && !isTreemapChart(targetType)) return true;

  return false;
}
```

### Flux de transformation

Lorsqu'un utilisateur switche entre types de graphiques :

```typescript
export function transformChartData(series: any[], currentType: ChartType, targetType: ChartType, categories?: any[]): { series: any[]; yCategories?: string[] } {
  let transformedSeries: any[] = series;
  let yCategories: string[] | undefined;

  // Étape 1 : Si changement de type, revenir au format standard
  if (currentType !== targetType) {
    const currentConfigurator = CHART_CONFIGURATORS.find((c) => c.isChartType(currentType));

    if (currentConfigurator?.transformData) {
      const result = currentConfigurator.transformData(
        transformedSeries,
        false, // false = vers format standard
        categories
      );

      if (Array.isArray(result)) {
        transformedSeries = result;
      } else {
        transformedSeries = result.series;
        yCategories = result.yCategories;
      }
    }
  }

  // Étape 2 : Transformer vers le type cible
  const targetConfigurator = CHART_CONFIGURATORS.find((c) => c.isChartType(targetType));

  if (targetConfigurator?.transformData) {
    const result = targetConfigurator.transformData(
      transformedSeries,
      true, // true = vers format spécial
      categories
    );

    if (Array.isArray(result)) {
      transformedSeries = result;
    } else {
      transformedSeries = result.series;
      yCategories = result.yCategories;
    }
  }

  return { series: transformedSeries, yCategories };
}
```

### Exemple de flux complet

**Scénario** : L'utilisateur passe de `line` → `heatmap` → `bubble`

1. **line → heatmap**

   - Format actuel : Standard `[{x, y}]`
   - Pas de transformation inverse nécessaire (déjà standard)
   - Transformation vers heatmap : `matrixToHeatmap()`
   - Résultat : Format heatmap `[x, y, value]` + catégories Y sauvegardées

2. **heatmap → bubble**
   - Format actuel : Heatmap `[x, y, value]`
   - Transformation inverse : `heatmapToSeries()` → retour au format standard
   - Transformation vers bubble : `transformToBubble()` → calcul de z
   - Résultat : Format bubble `{x, y, z}` + données originales sauvegardées

### Matrice de compatibilité

| Type source | Type cible | Transformation              | Perte d'info        |
| ----------- | ---------- | --------------------------- | ------------------- |
| Standard    | Range      | ✅ Auto-détection stratégie | ❌ Non (si mémoire) |
| Standard    | Bubble     | ✅ Calcul de z              | ❌ Non              |
| Standard    | Heatmap    | ✅ Matrice + catégories Y   | ❌ Non (si mémoire) |
| Standard    | Treemap    | ✅ Hiérarchie automatique   | ❌ Non (si mémoire) |
| Range       | Standard   | ✅ Extraction low/high      | ⚠️ Possible\*       |
| Bubble      | Standard   | ✅ Suppression de z         | ❌ Non              |
| Heatmap     | Standard   | ✅ Reconstruction séries    | ❌ Non (si mémoire) |
| Treemap     | Standard   | ✅ Aplatissement            | ⚠️ Possible\*       |

**\* Note** : Perte d'information possible uniquement si les données originales n'ont pas été sauvegardées en mémoire (Symbol).

---

## Conclusion

Le système de transformations intelligentes de jquery-highcharts offre :

1. **Flexibilité maximale** : Permet de switcher entre n'importe quels types de graphiques sans modifier les données source
2. **Automatisation complète** : Détection automatique du format et choix de la stratégie optimale
3. **Préservation des données** : Système de mémoire par Symbols garantissant aucune perte d'information
4. **Performance optimisée** : Transformations calculées uniquement quand nécessaire
5. **Expérience utilisateur** : L'utilisateur fournit des données simples, la bibliothèque s'occupe du reste

Cette architecture permet une utilisation intuitive tout en offrant une puissance et une flexibilité maximales pour la visualisation de données.

---

**Document généré le 8 octobre 2025**
**jquery-highcharts v1.0.0**
