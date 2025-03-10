export const dataStructure = {
  simpleData: {
    code: `// Données pour un graphique en pie simple
const pieData = [
  { category: 'A', value: 30 },
  { category: 'B', value: 40 },
  { category: 'C', value: 30 }
];

// Données pour un graphique à barres simple
const barData = [
  { month: 'Jan', sales: 1000 },
  { month: 'Feb', sales: 1200 },
  { month: 'Mar', sales: 900 },
  { month: 'Apr', sales: 1500 }
];`,
  },

  complexData: {
    code: `// Données avec structure imbriquée pour graphique composite
const complexData = [
  { 
    date: '2023-01',
    metrics: {
      revenue: 5000,
      costs: 3000,
      profit: 2000
    },
    segments: {
      online: 3500,
      inStore: 1500
    }
  },
  { 
    date: '2023-02',
    metrics: {
      revenue: 5500,
      costs: 3200,
      profit: 2300
    },
    segments: {
      online: 3800,
      inStore: 1700
    }
  }
];

// Données pour un graphique à séries multiples
const multiSeriesData = [
  { count_2xx: 110, count_4xx: 160, count_5xx: 80, field: 'Api 1' },
  { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 2' },
  { count_2xx: 60, count_4xx: 30, count_5xx: 20, field: 'Api 3' }
];`,
  },

  completeConfig: {
    code: `const pieExample = {
  data: [
    { count: 100, field: '2xx' },
    { count: 60, field: '4xx' },
    { count: 80, field: '5xx' },
    { count: 70, field: '9xx' },
    { count: 40, field: '3xx' }
  ],
  config: {
    // Configuration générale
    height: 250,
    title: 'Distribution des codes HTTP',
    subtitle: 'Répartition par type',
    showToolbar: true,
    
    // Configuration des séries et mapping de données
    series: [
      {
        data: { 
          x: field('field'),  // Valeur pour les labels
          y: field('count')   // Valeur pour les métriques
        },
        name: "Nombre d'appels"
      }
    ],
    
    // Options spécifiques à ApexCharts
    options: {
      colors: ['#CA3C66', '#DB6A8F', '#E8AABE', '#A7E0E0', '#4AA3A2'],
      // ... autres options de personnalisation
    }
  }
};`,
  },
};
