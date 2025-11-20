// Importer Highmaps (qui inclut Highcharts + le module map)
import * as Highcharts from 'highcharts/highmaps';
import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Exporting from 'highcharts/modules/exporting';
import ExportDataModule from 'highcharts/modules/export-data';
import Funnel from 'highcharts/modules/funnel';
import Treemap from 'highcharts/modules/treemap';
import Heatmap from 'highcharts/modules/heatmap';

more(Highcharts);
NoDataToDisplay(Highcharts);
Exporting(Highcharts);
ExportDataModule(Highcharts);
Funnel(Highcharts);
Treemap(Highcharts);
Heatmap(Highcharts);

export { Highcharts };
