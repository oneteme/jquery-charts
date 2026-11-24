import { APEXCHARTS_EXAMPLES } from './apexcharts-examples.data';
import { ECHARTS_EXAMPLES } from './echarts-examples.data';
import { HIGHCHARTS_EXAMPLES } from './highcharts-examples.data';
import {
  APEXCHARTS_SECTIONS,
  ChartExampleSection,
  ECHARTS_SECTIONS,
  HIGHCHARTS_SECTIONS,
} from '../../pages/charts/chart-example-sections';

type ExampleCollection = Record<string, { data: unknown[]; config: unknown }>;

const LIBRARIES: { name: string; sections: ChartExampleSection[]; examples: ExampleCollection }[] = [
  { name: 'ECharts', sections: ECHARTS_SECTIONS, examples: ECHARTS_EXAMPLES },
  { name: 'Highcharts', sections: HIGHCHARTS_SECTIONS, examples: HIGHCHARTS_EXAMPLES },
  { name: 'ApexCharts', sections: APEXCHARTS_SECTIONS, examples: APEXCHARTS_EXAMPLES },
];

describe('Exemples de graphiques', () => {
  for (const { name, sections, examples } of LIBRARIES) {
    describe(name, () => {
      it('fournit un exemple pour chaque section de la galerie', () => {
        const missingKeys = sections
          .map(section => section.exampleKey)
          .filter(key => !examples[key]);

        expect(missingKeys).toEqual([]);
      });

      it('fournit des données et une configuration à chaque exemple', () => {
        const incomplete = Object.entries(examples)
          .filter(([, example]) => !example.data?.length || !example.config)
          .map(([key]) => key);

        expect(incomplete).toEqual([]);
      });
    });
  }
});
