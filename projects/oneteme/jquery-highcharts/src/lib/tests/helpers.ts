export const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
export const TEAMS = ['Équipe A', 'Équipe B', 'Équipe C'];

export function makeHeatmapRawData(): any[] {
  // 3 équipes x 6 mois
  const values = [
    [44, 55, 57, 56, 61, 58],
    [76, 85, 101, 98, 87, 105],
    [35, 41, 36, 33, 42, 30],
  ];
  const rows: any[] = [];
  TEAMS.forEach((team, y) => {
    MONTHS.forEach((month, x) => {
      rows.push({ team, month, value: values[y][x] });
    });
  });
  return rows;
}

export function makeSimplePieCommonChart() {
  // Simule un commonChart renvoyé par buildSingleSerieChart pour pie
  const data = makeHeatmapRawData().map(r => ({ name: `${r.month}_${r.team}`, y: r.value }));
  return {
    series: [{ name: 'Performance par mois', data }],
    options: {},
    title: 'Performance par mois',
    subtitle: 'Données 2025',
    xtitle: 'Mois',
    ytitle: 'Valeur',
  };
}

// Données catégories/séries utilisables pour standard (bar/column/line)
export function makeCategorySeriesRawData(): any[] {
  return makeHeatmapRawData();
}

// Données bulles: tableau de séries avec valeurs [x,y,z]
export function makeBubbleRawData() {
  return [
    { name: 'S1', values: [ [0, 10, 5], [1, 15, 8], [2, 8, 3] ] },
    { name: 'S2', values: [ [0, 12, 7], [1, 9,  4], [2, 11, 6] ] },
  ];
}

// Jeu de données boxplot simple (mix objets/array/valeurs)
export function makeBoxplotRawData() {
  return [
    {
      name: 'S1',
      data: [
        { low: 1, q1: 2, median: 3, q3: 4, high: 5 },
        [1, 2, 3, 4, 5, 6],
        { value: 10 },
      ],
    },
  ];
}
