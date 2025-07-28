import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Annotations from 'highcharts/modules/annotations';
import Accessibility from 'highcharts/modules/accessibility';
import Exporting from 'highcharts/modules/exporting';
import ExportDataModule from 'highcharts/modules/export-data';
import Funnel from 'highcharts/modules/funnel';
import HighchartsMap from 'highcharts/modules/map';
import Treemap from 'highcharts/modules/treemap';
import Heatmap from 'highcharts/modules/heatmap';

more(Highcharts);
NoDataToDisplay(Highcharts);
Annotations(Highcharts);
Accessibility(Highcharts);
Exporting(Highcharts);
ExportDataModule(Highcharts);
Funnel(Highcharts);
HighchartsMap(Highcharts);
Treemap(Highcharts);
Heatmap(Highcharts);

export { Highcharts };
