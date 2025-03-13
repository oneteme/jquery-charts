export const dataValues = {
  basic: {
    code: `// Utilisation des values pour les données statiques
import { values, field } from '@oneteme/jquery-core';

// Définition basique avec values()
series: [{
  data: {
    x: values('Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin'),  // Axe X fixe
    y: values(30, 50, 70, 85, 90, 100)                    // Valeurs Y fixes
  }
}]

// Les valeurs peuvent être de n'importe quel type
values(1, 2, 3, 4, 5)                   // Nombres entiers
values(1.5, 2.7, 3.9)                   // Nombres décimaux
values('A', 'B', 'C')                   // Chaînes
values(true, false, true)               // Booléens
values(new Date(), new Date(2022, 0, 1)) // Dates

// Les values() renvoient les valeurs dans l'ordre où elles sont définies
// Un indexeur est utilisé pour sélectionner la valeur correspondante à l'entrée`,
  },
  axisExample: {
    code: `// Utilisation de values() pour définir l'axe X
import { values, field } from '@oneteme/jquery-core';

// 1. Axe X avec les mois de l'année
const data = [
  { month_index: 0, sales: 1200 },
  { month_index: 1, sales: 1700 },
  { month_index: 2, sales: 2100 }
];

config: {
  series: [{
    data: {
      // month_index sert d'indexeur pour sélectionner 
         la valeur dans le tableau
      x: values('Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul',
         'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'),
      y: field('sales')
    }
  }]
}

// 2. Axe X avec des trimestres, utilisé avec un field
const quarterData = [
  { quarter: 'Q1', value: 1000 },
  { quarter: 'Q2', value: 1200 },
  { quarter: 'Q3', value: 950 },
  { quarter: 'Q4', value: 1500 }
];

config: {
  series: [{
    data: {
      x: field('quarter'), // Utilise directement la valeur du champ
      y: field('value')
    }
  }]
}`,
  },
  staticChart: {
    code: `// Création d'un graphique entièrement statique avec values()
import { values } from '@oneteme/jquery-core';

// Graphique en barres avec données prédéfinies
const barChartConfig = {
  type: 'bar',
  config: {
    series: [{
      data: {
        x: values('Produit A', 'Produit B', 'Produit C', 'Produit D'),
        y: values(120, 180, 90, 210)
      },
      name: values('Ventes 2023')
    }]
  }
};

// Graphique pie avec données prédéfinies
const pieChartConfig = {
  type: 'pie',
  config: {
    series: [{
      data: {
        x: values('Chrome', 'Firefox', 'Safari', 'Edge', 'Autres'),
        y: values(64, 12, 10, 8, 6)
      }
    }]
  }
};

// Les values() peuvent être utilisées à n'importe quel niveau 
   de la configuration
// - Axes
// - Séries
// - Titres
// - Couleurs
// - Tooltips, etc.

// Pour les couleurs de série
color: values('#FF5733', '#33FF57', '#5733FF')

// Pour les options de légende
legend: {
  titles: values('Série 1', 'Série 2', 'Série 3')
}`,
  },
};
