export const dataCombine = {
  basic: {
    code: `// Combinaison de données complexes
import { field, combineFields, joinFields } from '@oneteme/jquery-core';

// Données de test
const data = [
  { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
  { count_2xx: 120, count_4xx: 30, count_5xx: 15, field: 'Api 2' }
];

// Configuration combinant plusieurs sources de données
config: {
  series: [
    {
      data: {
        x: field('field'),
        y: combineFields(
          args => args.reduce((acc, val) => acc + val), 
          ['count_2xx', 'count_4xx', 'count_5xx']
        )
      },
      name: "Total d'appels"
    }
  ]
}`,
  },
  joinFields: {
    code: `// Exemple d'utilisation de joinFields()
import { field, joinFields } from '@oneteme/jquery-core';

const data = [
  { firstName: 'John', lastName: 'Doe', age: 32 },
  { firstName: 'Jane', lastName: 'Smith', age: 28 }
];

series: [{
  data: {
    x: joinFields(' ', ['firstName', 'lastName']), 
    // "John Doe", "Jane Smith"
    y: field('age')
  }
}]

// Utilisation avec séparateur personnalisé
joinFields(', ', ['lastName', 'firstName']) 
// "Doe, John", "Smith, Jane"

// Utilisation avec préfixe/suffixe
joinFields(' - ', ['firstName', 'lastName'], 'Person: ', '') 
// "Person: John - Doe", "Person: Jane - Smith"`,
  },
  combineFields: {
    code: `// Exemple d'utilisation de combineFields()
import { field, combineFields } from '@oneteme/jquery-core';

const data = [
  { revenue: 5000, costs: 3000, date: '2023-01' },
  { revenue: 6200, costs: 3500, date: '2023-02' }
];

// Calcul de marge bénéficiaire
series: [{
  data: {
    x: field('date'),
    y: combineFields(
      ([revenue, costs]) => (revenue - costs) / revenue * 100, 
      // Calcul du pourcentage de marge
      ['revenue', 'costs']
    )
  },
  name: 'Marge bénéficiaire (%)'
}]

// Calcul de ratio
combineFields(
  ([count1, count2]) => count1 / (count1 + count2) * 100,
  ['count_success', 'count_error']
) // Pourcentage de succès

// Agrégation de plusieurs métriques
combineFields(
  values => values.reduce((sum, v) => sum + v, 0),
  ['metric1', 'metric2', 'metric3', 'metric4']
) // Somme de toutes les métriques`,
  },
};
