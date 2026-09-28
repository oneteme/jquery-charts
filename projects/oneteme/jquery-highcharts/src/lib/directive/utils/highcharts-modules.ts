// Importer Highmaps (qui inclut Highcharts + le module map)
import * as Highcharts from 'highcharts/highmaps';
import more from 'highcharts/highcharts-more';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import Exporting from 'highcharts/modules/exporting';
import OfflineExporting from 'highcharts/modules/offline-exporting';
import ExportDataModule from 'highcharts/modules/export-data';
import Drilldown from 'highcharts/modules/drilldown';
import Funnel from 'highcharts/modules/funnel';
import Treemap from 'highcharts/modules/treemap';
import Heatmap from 'highcharts/modules/heatmap';
import Accessibility from 'highcharts/modules/accessibility';

export const FRENCH_HIGHCHARTS_LANG: Highcharts.LangOptions = {
	contextButtonTitle: 'Menu contextuel du graphique',
	downloadCSV: 'Télécharger le CSV',
	downloadJPEG: 'Télécharger l’image JPEG',
	downloadPDF: 'Télécharger le PDF',
	downloadPNG: 'Télécharger l’image PNG',
	downloadSVG: 'Télécharger le SVG',
	exitFullscreen: 'Quitter le plein écran',
	hideData: 'Masquer le tableau de données',
	loading: 'Chargement...',
	noData: 'Aucune donnée à afficher',
	printChart: 'Imprimer le graphique',
	resetZoom: 'Réinitialiser le zoom',
	resetZoomTitle: 'Réinitialiser le zoom',
	viewData: 'Afficher le tableau de données',
	viewFullscreen: 'Afficher en plein écran',
};

Highcharts.setOptions({ lang: FRENCH_HIGHCHARTS_LANG });

more(Highcharts);
NoDataToDisplay(Highcharts);
Exporting(Highcharts);
OfflineExporting(Highcharts);
ExportDataModule(Highcharts);
Drilldown(Highcharts);
Funnel(Highcharts);
Treemap(Highcharts);
Heatmap(Highcharts);
Accessibility(Highcharts);

export { Highcharts };
