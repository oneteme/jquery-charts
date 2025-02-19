export const dataProviders = {
  basic: {
    code: `// Utilisation des data providers
import { field, values, joinFields } from '@oneteme/jquery-core';

// Accès simple à un champ
data: { x: field('name'), y: field('value') }

// Valeurs statiques
data: { x: values('2xx', '4xx', '5xx'), y: values(110, 160, 80) }

// Jointure de champs
data: { x: joinFields('_', 'field', 'subField'), y: field('count') }`
  }
};
