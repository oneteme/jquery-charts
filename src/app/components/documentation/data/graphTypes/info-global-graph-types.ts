export const infoGlobalGraphTypes = {
  basic: {
    code: `// Types de graphiques disponibles
interface ChartFamily {
  circular: 'pie' | 'donut' | 'polar' | 'radar';     // Données proportionnelles
  bars: 'bar' | 'column';                            // Comparaisons catégorielles
  lines: 'line' | 'area';                            // Évolutions temporelles
  matrix: 'treemap' | 'heatmap';                     // Données hiérarchiques/intensités
  ranges: 'rangeArea' | 'rangeBar';                  // Plages de valeurs
  process: 'funnel' | 'pyramid';                     // Processus séquentiels
}

// Structure commune à tous les types
interface ChartConfig<X, Y> {
  series: [{
    data: {
      x: DataProvider<X>;     // Source de données (catégories/dates)
      y: DataProvider<Y>;     // Valeurs à représenter
    };
    name?: string;           // Identification de la série
  }];

  // Options générales
  height: number;            // Hauteur (obligatoire)
  showToolbar?: boolean;     // Navigation entre types compatibles
  title?: string;           // Titre du graphique
}

/* Important:
 * 1. La configuration reste cohérente entre les types
 * 2. Certains types acceptent des options spécifiques
 * 3. L'ajout d'une toolbar peut permettre de basculer entre types compatibles
 */`,
  }
};
