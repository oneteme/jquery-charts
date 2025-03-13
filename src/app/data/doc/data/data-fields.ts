export const dataFields = {
  basic: {
    code: `// Utilisation des fields pour accéder aux données
import { field } from '@oneteme/jquery-core';

// 1. Accès simple à un champ
const data = [
  { name: 'Api 1', value: 30 },
  { name: 'Api 2', value: 45 },
  { name: 'Api 3', value: 25 }
];

config: {
  series: [{
    data: {
      x: field('name'),  // Accède au champ 'name' dans chaque objet
      y: field('value')  // Accède au champ 'value' dans chaque objet
    }
  }]
}

// 2. Application à tous les éléments du tableau
// Pour chaque objet dans le tableau, field() extrait la valeur demandée:
// x: ['Api 1', 'Api 2', 'Api 3']
// y: [30, 45, 25]`,
  },
  dynamicSeries: {
    code: `// Utilisation de field() pour définir des noms de séries dynamiques
import { field } from '@oneteme/jquery-core';

// Données avec identifiant de série
const data = [
  { category: 'A', value: 10, series_id: 'Série 1' },
  { category: 'B', value: 20, series_id: 'Série 1' },
  { category: 'A', value: 15, series_id: 'Série 2' },
  { category: 'B', value: 25, series_id: 'Série 2' }
];

// Configuration avec nom de série dynamique
config: {
  series: [{
    data: {
      x: field('category'),
      y: field('value')
    },
    name: field('series_id')  
    // Le nom de la série est extrait des données
  }]
}

// Utilisation avec d'autres propriétés de séries
series: [{
  data: { x: field('date'), y: field('value') },
  stack: field('group'),      // Groupement dynamique
  color: field('colorCode'),  // Couleur dynamique
  visible: field('isVisible') // Visibilité conditionnelle
}]`,
  },
  nestedProps: {
    code: `// Accès à des propriétés imbriquées avec field()
import { field } from '@oneteme/jquery-core';

// Données avec structures imbriquées
const data = [
  { 
    id: 1,
    metrics: { 
      performance: { response_time: 120, error_rate: 0.5 },
      usage: { requests: 5000, bandwidth: 1024 }
    },
    metadata: { name: 'API Gateway' }
  }
];

// field() ne permet pas d'accéder directement aux propriétés 
   imbriquées avec la notation à points
// Il faut donc utiliser d'autres approches:

// 1. Prétraitement des données
const processedData = data.map(item => ({
  name: item.metadata.name,
  responseTime: item.metrics.performance.response_time,
  requests: item.metrics.usage.requests
}));

config: {
  series: [{
    data: {
      x: field('name'),
      y: field('responseTime')
    }
  }]
}

// 2. Utilisation de combineFields avec une fonction personnalisée
import { combineFields } from '@oneteme/jquery-core';

series: [{
  data: {
    x: field('id'),
    y: combineFields(
      ([item]) => item.metrics.performance.response_time
    )
  }
}]`,
  },
};
