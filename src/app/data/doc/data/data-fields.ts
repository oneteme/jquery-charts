export const dataFields = {
  basic: {
    code: `// Utilisation des fields pour accéder aux données
import { field } from '@oneteme/jquery-core';

// 1. Accès simple à un champ
const data = [
  { name: 'Api 1', value: 30 }
];
data: {
  x: field('name'),  // Retourne 'Api 1'
  y: field('value')  // Retourne 30
}

// 2. Accès avec des noms composés
const data = [
  { 'response_2xx': 110, 'response_4xx': 160 }
];
data: {
  x: field('response_2xx'),  // Retourne 110
  y: field('response_4xx')   // Retourne 160
}

// 3. Utilisation avec name pour les noms de séries
series: [{
  data: { x: field('category'), y: field('value') },
  name: field('group')  // Le nom sera dynamique selon la valeur du champ 'group'
}]

// 4. Utilisation avec stack pour le groupement
series: [{
  data: { x: field('date'), y: field('value') },
  stack: field('group')  // Groupement dynamique selon la valeur du champ 'group'
}]`
  }
};
