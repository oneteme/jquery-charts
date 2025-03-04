export const infoGlobalGraphTypes = {
  basic: {
    code: `// Types de graphiques disponibles

interface ChartCompatibility {
  circular: 'pie' | 'donut' | 'polar' | 'radar';     // Données proportionnelles
  bars: 'bar' | 'column';                            // Comparaisons catégorielles
  lines: 'line' | 'area';                            // Évolutions temporelles
  matrix: 'treemap' | 'heatmap';                     // Données hiérarchiques/intensités
  ranges: 'rangeArea' | 'rangeBar';                  // Plages de valeurs
  process: 'funnel' | 'pyramid';                     // Processus séquentiels
}
  `},
};
