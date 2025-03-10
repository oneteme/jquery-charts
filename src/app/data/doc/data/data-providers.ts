export const dataProviders = {
  basic: {
    code: `// Définition d'un DataProvider
export declare type DataProvider<T> = (o: any, idx: number) => T;

// Différents types de DataProviders intégrés
import { field, values, joinFields, mapField } from '@oneteme/jquery-core';

// field() - extrait une propriété d'un objet
const nameProvider = field('name');
// résultat: nameProvider({name: 'API-1'}) => 'API-1'

// values() - fournit des valeurs statiques basées sur l'index
const statusProvider = values('Succès', 'Avertissement', 'Erreur');
// résultat: statusProvider(null, 0) => 'Succès', statusProvider(null, 1) => 'Avertissement'

// joinFields() - combine plusieurs propriétés avec un séparateur
const labelProvider = joinFields('-', 'type', 'name');
// résultat: labelProvider({type: 'GET', name: 'users'}) => 'GET-users'

// Utilisation dans une configuration de graphique
series: [
  {
    data: { 
      x: field('category'),   // DataProvider pour l'axe X
      y: field('value')       // DataProvider pour l'axe Y
    },
    name: field('series'),    // DataProvider pour le nom de série
    color: field('color')     // DataProvider pour les couleurs
  }
]`
  },
  mapping: {
    code: `// Utilisation de mapField pour transformer des valeurs
import { mapField } from '@oneteme/jquery-core';

// Définition d'un mapping de statuts HTTP vers des libellés
const statusMap = new Map([
  ['200', 'OK'],
  ['404', 'Not Found'],
  ['500', 'Server Error']
]);

// Création d'un DataProvider qui traduit les codes en libellés
const statusProvider = mapField('status', statusMap);
// résultat: statusProvider({status: '404'}) => 'Not Found'

// Exemple d'utilisation dans une configuration de graphique
series: [
  {
    data: { 
      x: field('endpoint'), 
      y: field('count') 
    },
    // Le nom de la série sera le libellé du statut
    name: statusProvider
  }
]`
  },
  custom: {
    code: `// Création d'un DataProvider personnalisé
import { field } from '@oneteme/jquery-core';

// DataProvider qui calcule un pourcentage
const percentageProvider = (o, i) => {
  return (o.value / o.total) * 100;
};

// DataProvider qui ajoute un suffixe à une valeur
const withUnitProvider = (unit) => {
  return (o, i) => {
    const value = field('value')(o, i);
    return \`\${value} \${unit}\`;
  };
};

// Exemple d'utilisation
series: [
  {
    data: { 
      x: field('category'), 
      y: percentageProvider  // Valeur en pourcentage
    },
    name: withUnitProvider('%')  // Ajoute le symbole % au nom
  }
]`
  }
};