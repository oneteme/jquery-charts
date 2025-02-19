export const dataCombine = {
  basic: {
    code: `// Combinaison de données complexes
{
  data: [
    { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' }
  ],
  config: {
    series: [
      {
        data: {
          x: field('field'),
          y: combineFields(args => args.reduce((acc, val) => acc + val),
             ['count_2xx', 'count_4xx', 'count_5xx'])
        },
        name: "Total d'appels"
      }
    ]
  }
}`,
  },
};
