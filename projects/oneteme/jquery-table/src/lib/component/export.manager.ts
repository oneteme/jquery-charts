import { TableColumnProvider, TableExportConfig } from '../jquery-table.model';

/**
 * ExportManager
 *
 * Encapsule l'export CSV : construction du fichier BOM/UTF-8, échappement et déclenchement du téléchargement.
 * Aucune dépendance Angular — indépendant du cycle de vie du composant.
 */
export class ExportManager<T> {
  constructor(
    private readonly getRows: () => T[],
    private readonly getColumns: () => TableColumnProvider<T>[],
    private readonly getConfig: () => TableExportConfig<T> | undefined,
    private readonly resolveCellValue: (col: TableColumnProvider<T>, row: T, index: number) => any,
  ) {}

  export(): void {
    const cfg = this.getConfig();
    if (!cfg?.enabled) return;
    const rows    = this.getRows();
    const columns = this.getColumns();
    const filename = (cfg.filename || 'export') + '.csv';

    const header = columns.map(c => this._csvEscape(c.header || c.key)).join(',');
    const lines = rows.map((row, idx) => {
      if (cfg.transform) {
        const t = cfg.transform(row);
        return columns.map(c => this._csvEscape(String(t[c.key] ?? ''))).join(',');
      }
      return columns.map(c => this._csvEscape(String(this.resolveCellValue(c, row, idx) ?? ''))).join(',');
    });

    // BOM UTF-8 pour une ouverture correcte sous Excel
    const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private _csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }
}
