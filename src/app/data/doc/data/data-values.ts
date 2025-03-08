export const dataValues = {
  basic: {
    code: `// Utilisation des values pour les données statiques
import { values } from '@oneteme/jquery-core';

// 1. Valeurs simples avec values()
series: [{
  data: {
    x: values('Jan', 'Fev', 'Mar'),  // Axe X fixe avec des labels
    y: values(30, 40, 50)            // Valeurs Y fixes
  }
}]

// 2. Combinaison avec fields
const data = [{ value2xx: 110, value4xx: 160 }];
series: [{
  data: {
    x: values('2xx', '4xx'),     // Labels fixes pour l'axe X
    y: field('value2xx')         // Valeurs dynamiques depuis les données
  }
}]

// 3. Utilisation pour les couleurs
series: [{
  data: { x: field('name'), y: field('value') },
  color: values('#FF0000', '#00FF00', '#0000FF')  // Couleurs fixes par série
}]

// 4. Utilisation pour les noms de séries
series: [{
  data: { x: field('date'), y: field('value') },
  name: values('Série A')  // Nom fixe de la série
}]

// 5. Valeurs numériques dans un graphique en barres
series: [{
  data: {
    x: values(2020, 2021, 2022),  // Années sur l'axe X
    y: values(100, 150, 200)      // Valeurs correspondantes
  }
}]

// Notes importantes :
// - values() crée un fournisseur de données statiques
// - Utile pour les données fixes ou prédéfinies
// - Peut être combiné avec field() pour des données mixtes
// - Ordre des valeurs important, doit correspondre aux données
// - Une erreur est levée si l'index dépasse le nombre de valeurs`
  }
};
