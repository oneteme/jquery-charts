import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ChartDrilldownConfig,
  ChartDrilldownRequest,
  ChartProvider,
  field,
} from '@oneteme/jquery-core';
import { ChartComponent as HighchartsChartComponent } from '@oneteme/jquery-highcharts';
import {
  OrganizerButtonComponent,
  OrganizerButtonEvent,
  OrganizerConfig as OrganizerMenuConfig,
  OrganizerState as OrganizerMenuState,
} from '@oneteme/jquery-organizer';
import { col, TableComponent, TableProvider } from '@oneteme/jquery-table';

type ProductPreviewKind = 'chart' | 'table' | 'organizer';

interface ProductPreview {
  kind: ProductPreviewKind;
  label: string;
  icon: string;
}

interface ProductChartRow {
  period: string;
  revenue: number;
  conversion: number;
}

interface ProductTableRow {
  month: string;
  region: string;
  channel: string;
  orders: number;
  revenue: number;
  margin: number;
}

interface OrganizerResultRow {
  label: string;
  value: number;
  formattedValue: string;
  width: number;
}

@Component({
  selector: 'home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HighchartsChartComponent, TableComponent, OrganizerButtonComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  readonly productPreviews: ProductPreview[] = [
    {
      kind: 'chart',
      label: 'Graphique',
      icon: 'show_chart',
    },
    {
      kind: 'table',
      label: 'Tableau',
      icon: 'table_rows',
    },
    {
      kind: 'organizer',
      label: 'Organizer',
      icon: 'tune',
    },
  ];

  private readonly monthlyChartData: ProductChartRow[] = [
    { period: 'Jan', revenue: 28, conversion: 2.8 },
    { period: 'Fév', revenue: 31, conversion: 3.1 },
    { period: 'Mar', revenue: 29, conversion: 2.9 },
    { period: 'Avr', revenue: 38, conversion: 3.5 },
    { period: 'Mai', revenue: 42, conversion: 3.8 },
    { period: 'Juin', revenue: 46, conversion: 4.2 },
    { period: 'Juil', revenue: 44, conversion: 3.9 },
    { period: 'Août', revenue: 35, conversion: 3.3 },
    { period: 'Sep', revenue: 48, conversion: 4.4 },
    { period: 'Oct', revenue: 53, conversion: 4.7 },
    { period: 'Nov', revenue: 57, conversion: 5.1 },
    { period: 'Déc', revenue: 62, conversion: 5.4 },
  ];

  productChartData: ProductChartRow[] = this.monthlyChartData;
  productChartConfig: ChartProvider<string, number> = this.createProductChartConfig('Performance annuelle');
  productChartDrilldown: ChartDrilldownConfig = {
    levels: [
      { id: 'months', label: 'Mois', groupBy: 'period' },
      { id: 'days', label: 'Jours', groupBy: 'period' },
    ],
    activeLevel: 'months',
  };

  readonly productTableData: ProductTableRow[] = [
    { month: 'Jan', region: 'Nord', channel: 'Agence', orders: 248, revenue: 42860, margin: 31 },
    { month: 'Fév', region: 'Sud', channel: 'En ligne', orders: 193, revenue: 35420, margin: 28 },
    { month: 'Mar', region: 'Ouest', channel: 'Partenaires', orders: 156, revenue: 28190, margin: 26 },
    { month: 'Avr', region: 'Est', channel: 'Agence', orders: 121, revenue: 21640, margin: 24 },
    { month: 'Mai', region: 'Nord', channel: 'En ligne', orders: 217, revenue: 39120, margin: 33 },
    { month: 'Juin', region: 'Sud', channel: 'Agence', orders: 184, revenue: 32980, margin: 29 },
    { month: 'Juil', region: 'Ouest', channel: 'En ligne', orders: 169, revenue: 30450, margin: 27 },
    { month: 'Août', region: 'Est', channel: 'Partenaires', orders: 138, revenue: 24760, margin: 25 },
    { month: 'Sep', region: 'Nord', channel: 'Partenaires', orders: 202, revenue: 36740, margin: 30 },
    { month: 'Oct', region: 'Sud', channel: 'En ligne', orders: 176, revenue: 31860, margin: 28 },
    { month: 'Nov', region: 'Ouest', channel: 'Agence', orders: 147, revenue: 26930, margin: 26 },
    { month: 'Déc', region: 'Est', channel: 'En ligne', orders: 132, revenue: 23810, margin: 23 },
  ];

  readonly productTableConfig: TableProvider<ProductTableRow> = {
    search: { enabled: true, searchColumns: ['region', 'channel'] },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10], showFirstLastButtons: true },
    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },
    export: { enabled: true, filename: 'performance-regionale' },
    preferences: { enabled: true, tableId: 'home-product-table' },
    defaultSort: { active: 'revenue', direction: 'desc' },
    slices: [
      { title: 'Région', columnKey: 'region', multiSelect: true },
      { title: 'Canal', columnKey: 'channel', multiSelect: true },
    ],
    slicePanelCollapsed: true,
    columns: [
      col<ProductTableRow>('region', 'Région', { sortable: true, groupable: true, sliceable: true }),
      col<ProductTableRow>('channel', 'Canal', { sortable: true, groupable: true, sliceable: true }),
      col<ProductTableRow>('orders', 'Commandes', { sortable: true }),
      {
        key: 'revenue',
        header: 'Chiffre d’affaires',
        width: '28%',
        sortable: true,
        value: row => `${row.revenue.toLocaleString('fr-FR')} €`,
        sortValue: row => row.revenue,
      },
      {
        key: 'margin',
        header: 'Marge',
        sortable: true,
        optional: true,
        value: row => `${row.margin} %`,
        sortValue: row => row.margin,
      },
    ],
    rowClass: row => ({ 'product-table-row--highlight': row.margin >= 30 }),
  };

  private createProductChartConfig(title: string): ChartProvider<string, number> {
    return {
    title,
    subtitle: 'Cliquez sur un mois pour afficher le détail journalier',
    height: 330,
    showToolbar: false,
    series: [
      {
        name: 'Chiffre d’affaires',
        type: 'areaspline',
        unit: 'k€',
        showUnitOnAxis: false,
        yAxisIndex: 0,
        color: '#2c605d',
        data: { x: field('period'), y: field('revenue') },
      },
      {
        name: 'Taux de conversion',
        type: 'spline',
        unit: '%',
        showUnitOnAxis: false,
        yAxisIndex: 1,
        yAxisConfig: { opposite: true },
        color: '#c6532f',
        data: { x: field('period'), y: field('conversion') },
      },
    ],
    options: {
      chart: {
        type: 'areaspline',
        zoomType: 'x',
        backgroundColor: 'transparent',
        spacing: [10, 14, 8, 8],
      },
      colors: ['#2c605d', '#c6532f'],
      dataLabels: { enabled: false },
      credits: { enabled: false },
      legend: { align: 'center', itemStyle: { color: '#2c605d', fontWeight: '600' } },
      plotOptions: {
        areaspline: { fillOpacity: 0.14 },
        series: { animation: false, marker: { enabled: true, radius: 3 } },
      },
      tooltip: { shared: true, valueDecimals: 0 },
      subtitle: { align: 'center' },
      xAxis: {
        lineColor: '#b8cbc5',
        tickColor: '#b8cbc5',
        crosshair: { color: '#c6532f', width: 1 },
      },
      yAxis: [
        { title: { text: null }, gridLineColor: '#d7e1de', labels: { format: '{value} k€' } },
        { title: { text: null }, opposite: true, gridLineWidth: 0, labels: { format: '{value} %' } },
      ],
    },
  };
  }

  readonly productOrganizerConfig: OrganizerMenuConfig = {
    fields: [
      { id: 'region', label: 'Région', icon: 'public', visible: true },
      { id: 'channel', label: 'Canal', icon: 'storefront', visible: true },
      { id: 'revenue', label: 'Chiffre d’affaires', icon: 'payments', visible: true },
      { id: 'orders', label: 'Commandes', icon: 'shopping_bag', visible: true },
      { id: 'margin', label: 'Marge', icon: 'percent', visible: false },
    ],
    xFields: [
      { id: 'month', label: 'Mois' },
      { id: 'region', label: 'Région' },
      { id: 'channel', label: 'Canal' },
    ],
    yFields: [
      {
        id: 'revenue',
        label: 'Chiffre d’affaires',
        aggregates: [
          { id: 'sum', label: 'Somme' },
          { id: 'average', label: 'Moyenne' },
          { id: 'min', label: 'Minimum' },
          { id: 'max', label: 'Maximum' },
        ],
      },
      {
        id: 'orders',
        label: 'Commandes',
        aggregates: [{ id: 'sum', label: 'Somme' }],
      },
      {
        id: 'margin',
        label: 'Marge',
        aggregates: [{ id: 'average', label: 'Moyenne' }],
      },
    ],
    groups: [
      { id: 'region', label: 'Région' },
      { id: 'channel', label: 'Canal' },
    ],
    slices: [
      { id: 'region', label: 'Région' },
      { id: 'channel', label: 'Canal' },
      { id: 'period', label: 'Période' },
    ],
    templates: [
      { id: 'executive', label: 'Vue direction', xField: 'month', yField: 'revenue', yAggregate: 'sum' },
      { id: 'regional', label: 'Vue régionale', xField: 'region', yField: 'revenue', yAggregate: 'sum', groupBy: 'region' },
    ],
    chartTypes: [
      { id: 'column', label: 'Colonnes', icon: 'bar_chart' },
      { id: 'line', label: 'Courbe', icon: 'show_chart' },
      { id: 'area', label: 'Aire', icon: 'area_chart' },
      { id: 'table', label: 'Tableau', icon: 'table_rows' },
    ],
    showExport: true,
    onExportVisual: () => undefined,
    onExportData: () => undefined,
    showActions: true,
    actions: { label: 'Actions', showCopy: true, showFullscreen: true },
    onCopyVisual: () => undefined,
    onToggleFullscreen: () => undefined,
    showPreferences: true,
    hasSavedPreferences: true,
    onPreferencesEdit: () => undefined,
    onPreferencesSave: () => undefined,
    onPreferencesClear: () => undefined,
    showReset: true,
  };

  productOrganizerState: OrganizerMenuState = {
    viewMode: 'chart',
    visibleFields: ['region', 'channel', 'revenue', 'orders'],
    selectedChartType: 'column',
    selectedX: 'month',
    selectedY: 'revenue',
    selectedYAggregate: 'sum',
    selectedGroupBy: 'region',
    selectedSlices: ['channel'],
    selectedTemplate: 'executive',
  };

  activePreviewIndex = 0;

  selectPreview(index: number): void {
    this.activePreviewIndex = index;
  }

  scrollToProductBenefits(): void {
    document.getElementById('product-benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onProductOrganizerChange(event: OrganizerButtonEvent): void {
    this.productOrganizerState = event.state;
  }

  get organizerMetricLabel(): string {
    if (this.productOrganizerState.selectedY === 'orders') return 'Commandes';
    if (this.productOrganizerState.selectedY === 'margin') return 'Marge';
    return 'Chiffre d’affaires';
  }

  get organizerDimensionLabel(): string {
    if (this.productOrganizerState.selectedX === 'region') return 'région';
    if (this.productOrganizerState.selectedX === 'channel') return 'canal';
    return 'mois';
  }

  get organizerAggregateLabel(): string {
    if (this.productOrganizerState.selectedYAggregate === 'average') return 'Moyenne';
    if (this.productOrganizerState.selectedYAggregate === 'min') return 'Minimum';
    if (this.productOrganizerState.selectedYAggregate === 'max') return 'Maximum';
    return 'Total';
  }

  get organizerFilterLabels(): string[] {
    const labels: Record<string, string> = { region: 'Région', channel: 'Canal', period: 'Période' };
    return (this.productOrganizerState.selectedSlices || []).map(slice => labels[slice] || slice);
  }

  private getOrganizerDimension(): 'month' | 'region' | 'channel' {
    if (this.productOrganizerState.selectedX === 'region') return 'region';
    if (this.productOrganizerState.selectedX === 'channel') return 'channel';
    return 'month';
  }

  private getOrganizerMetric(): 'orders' | 'margin' | 'revenue' {
    if (this.productOrganizerState.selectedY === 'orders') return 'orders';
    if (this.productOrganizerState.selectedY === 'margin') return 'margin';
    return 'revenue';
  }

  get organizerResultRows(): OrganizerResultRow[] {
    const dimension = this.getOrganizerDimension();
    const grouped = new Map<string, ProductTableRow[]>();

    this.productTableData.forEach(row => {
      const key = row[dimension];
      grouped.set(key, [...(grouped.get(key) || []), row]);
    });

    const rows = Array.from(grouped, ([label, values]) => {
      const value = this.aggregateOrganizerValues(values);
      return { label, value, formattedValue: this.formatOrganizerValue(value), width: 0 };
    }).slice(0, 6);
    const maximum = Math.max(...rows.map(row => row.value), 1);
    return rows.map(row => ({ ...row, width: Math.max(12, (row.value / maximum) * 100) }));
  }

  get organizerResultTotal(): string {
    return this.formatOrganizerValue(this.aggregateOrganizerValues(this.productTableData));
  }

  private aggregateOrganizerValues(rows: ProductTableRow[]): number {
    const metric = this.getOrganizerMetric();
    const values = rows.map(row => row[metric]);
    const aggregate = this.productOrganizerState.selectedYAggregate;

    if (aggregate === 'average') return values.reduce((sum, value) => sum + value, 0) / values.length;
    if (aggregate === 'min') return Math.min(...values);
    if (aggregate === 'max') return Math.max(...values);
    return values.reduce((sum, value) => sum + value, 0);
  }

  private formatOrganizerValue(value: number): string {
    if (this.productOrganizerState.selectedY === 'margin') return `${value.toFixed(1)} %`;
    if (this.productOrganizerState.selectedY === 'orders') return Math.round(value).toLocaleString('fr-FR');
    return `${Math.round(value).toLocaleString('fr-FR')} €`;
  }

  onProductChartDrilldown(request: ChartDrilldownRequest): void {
    if (request.toLevel !== 'days') return;
    if (typeof request.value !== 'string' && typeof request.value !== 'number') return;
    const month = `${request.value}`;
    const monthIndex = Math.max(0, this.monthlyChartData.findIndex(row => row.period === month));
    const source = this.monthlyChartData[monthIndex];
    this.productChartData = Array.from({ length: 30 }, (_, index) => {
      const wave = Math.sin((index + monthIndex) * 0.72);
      return {
        period: `${index + 1}`,
        revenue: Number((source.revenue / 30 * (1 + wave * 0.24)).toFixed(1)),
        conversion: Number((source.conversion * (1 + wave * 0.12)).toFixed(1)),
      };
    });
    this.productChartConfig = this.createProductChartConfig(`${month} · détail journalier`);
    this.productChartDrilldown = { ...this.productChartDrilldown, activeLevel: 'days' };
  }

  onProductChartNavigate(levelId: string): void {
    if (levelId !== 'months') return;
    this.productChartData = this.monthlyChartData;
    this.productChartConfig = this.createProductChartConfig('Performance annuelle');
    this.productChartDrilldown = { ...this.productChartDrilldown, activeLevel: 'months' };
  }

}
