# Chart Utils - Fonctionnalités de Conversion en Pourcentage

## Migration et Améliorations

La fonctionnalité de conversion en pourcentage a été migrée de `chart-options.ts` vers `chart-utils.ts` avec des améliorations significatives.

## Nouvelles Fonctionnalités

### 1. Détection Automatique des Données en Pourcentage

La fonction `analyzeChartData()` analyse automatiquement vos données pour déterminer :
- Si elles sont déjà en pourcentage
- Le type de format recommandé (entier, décimal, pourcentage)
- Des statistiques utiles (min, max, moyenne, etc.)

```typescript
const data = [25.5, 30.2, 44.3]; // Données qui semblent être en %
const analysis = analyzeChartData(data);
console.log(analysis.isAlreadyPercentage); // true
console.log(analysis.suggestedFormat); // "percentage"
```

### 2. Configuration Avancée

```typescript
interface PercentageDisplayConfig {
  showPercent: boolean;
  forceConversion?: boolean; // Force la conversion même si déjà en %
  decimalPlaces?: number;   // Nombre de décimales
  autoDetect?: boolean;     // Active la détection automatique
  debug?: boolean;          // Mode debug
}
```

### 3. Utilisation

#### Méthode Simple (Compatible avec l'ancienne API)
```typescript
import { togglePercentDisplaySimple } from './chart-utils';

togglePercentDisplaySimple(chartOptions, true);
```

#### Méthode Avancée
```typescript
import { togglePercentDisplay } from './chart-utils';

const analysisResult = togglePercentDisplay(
  chartOptions,
  {
    showPercent: true,
    autoDetect: true,
    decimalPlaces: 2,
    debug: true
  },
  chartData
);

if (analysisResult?.isAlreadyPercentage) {
  console.log('Les données sont déjà en pourcentage !');
}
```

## Heuristiques de Détection

La fonction détecte automatiquement si les données sont en pourcentage en vérifiant :

1. **Toutes les valeurs sont entre 0 et 100**
2. **La somme est proche de 100** (± 5%) pour les graphiques circulaires
3. **Présence de décimales avec des valeurs < 100**

## Exemples de Données Détectées

```typescript
// ✅ Détecté comme pourcentage
[25.5, 30.2, 44.3]     // Somme ≈ 100
[15.7, 84.3]           // Somme ≈ 100
[12.5, 67.8, 19.7]     // Somme ≈ 100

// ❌ Pas détecté comme pourcentage  
[250, 300, 450]        // Valeurs > 100
[12, 34, 56, 78]       // Somme ≠ 100
```

## Formats d'Affichage Intelligents

- **Données déjà en %** : Affiche `{point.y}%` directement
- **Conversion nécessaire** : Utilise `{point.percentage}%` de Highcharts
- **Format décimal** : Respecte le nombre de décimales configuré
- **Format entier** : Pas de décimales pour les valeurs entières

## Migration depuis l'Ancienne Version

```typescript
// ❌ Ancienne méthode
import { togglePercentDisplay } from './chart-options';
togglePercentDisplay(options, true);

// ✅ Nouvelle méthode (compatible)
import { togglePercentDisplaySimple } from './chart-utils';
togglePercentDisplaySimple(options, true);

// ✅ Nouvelle méthode (avancée)
import { togglePercentDisplay } from './chart-utils';
togglePercentDisplay(options, { 
  showPercent: true, 
  autoDetect: true 
}, data);
```
