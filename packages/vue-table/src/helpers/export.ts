import type { ColumnDef, Row } from '@tanstack/vue-table';
import writeXlsxFile, { type Row as ExcelRow } from 'write-excel-file/universal';

export interface ExportColumn<TData> {
  id: string;
  header: string;
  accessor?: (row: TData) => unknown;
}

export interface ExportExcelOptions<TData> {
  data: (TData | Row<TData>)[];
  filename?: string;
  sheetName?: string;
  columns?: (ColumnDef<TData, unknown> | ExportColumn<TData>)[];
  headerStyle?: {
    fontWeight?: 'bold';
    backgroundColor?: string;
    color?: string;
  };
}

export interface ExportCsvOptions<TData> {
  data: (TData | Row<TData>)[];
  filename?: string;
  columns?: (ColumnDef<TData, unknown> | ExportColumn<TData>)[];
  includeBOM?: boolean;
}

export interface CopyTsvOptions<TData> {
  data: (TData | Row<TData>)[];
  columns?: (ColumnDef<TData, unknown> | ExportColumn<TData>)[];
}

type ColumnLike<TData> = ColumnDef<TData, unknown> | ExportColumn<TData>;

interface ResolvedExportColumn<TData> {
  id: string;
  header: string;
  getValue: (row: TData) => unknown;
}

function extractRawRows<TData>(rows: (TData | Row<TData>)[]): TData[] {
  return rows.map((r) => {
    if (r && typeof r === 'object' && Object.hasOwn(r, 'original')) {
      return (r as Row<TData>).original;
    }
    return r as TData;
  });
}

function getColumnId<TData>(col: ColumnLike<TData>): string {
  const candidate = col as unknown as Record<string, unknown>;
  if (typeof candidate.id === 'string' && candidate.id.length > 0) {
    return candidate.id;
  }
  if (candidate.accessorKey !== undefined && candidate.accessorKey !== null) {
    return String(candidate.accessorKey);
  }
  return '';
}

function getColumnHeader<TData>(col: ColumnLike<TData>, fallbackId: string): string {
  const candidate = col as unknown as Record<string, unknown>;
  if (typeof candidate.header === 'string' && candidate.header.length > 0) {
    return candidate.header;
  }
  return fallbackId;
}

function getColumnValueExtractor<TData>(
  col: ColumnLike<TData>,
  columnId: string
): (row: TData) => unknown {
  const candidate = col as unknown as Record<string, unknown>;
  if (typeof candidate.accessor === 'function') {
    const fn = candidate.accessor as (row: TData) => unknown;
    return (row: TData) => fn(row);
  }
  if (typeof candidate.accessorFn === 'function') {
    const fn = candidate.accessorFn as (row: TData) => unknown;
    return (row: TData) => fn(row);
  }
  if (candidate.accessorKey !== undefined && candidate.accessorKey !== null) {
    const key = String(candidate.accessorKey);
    return (row: TData) =>
      typeof row === 'object' && row !== null && Object.hasOwn(row, key)
        ? (row as Record<string, unknown>)[key]
        : undefined;
  }
  return (row: TData) =>
    typeof row === 'object' && row !== null && Object.hasOwn(row, columnId)
      ? (row as Record<string, unknown>)[columnId]
      : undefined;
}

function resolveColumns<TData>(
  data: TData[],
  columns?: ColumnLike<TData>[]
): ResolvedExportColumn<TData>[] {
  if (columns && columns.length > 0) {
    return columns
      .map((col) => {
        const id = getColumnId(col);
        return { col, id };
      })
      .filter(({ id }) => id !== 'select' && id !== 'actions' && id.length > 0)
      .map(({ col, id }) => ({
        id,
        header: getColumnHeader(col, id),
        getValue: getColumnValueExtractor(col, id),
      }));
  }

  if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    const firstRow = data[0] as Record<string, unknown>;
    return Object.keys(firstRow).map((key) => ({
      id: key,
      header: key,
      getValue: (row: TData) =>
        typeof row === 'object' && row !== null && Object.hasOwn(row, key)
          ? (row as Record<string, unknown>)[key]
          : undefined,
    }));
  }

  return [];
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeTsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

/**
 * Generate CSV string from table records
 */
export function generateCsv<TData>(options: Omit<ExportCsvOptions<TData>, 'filename'>): string {
  const rawRows = extractRawRows(options.data);
  const cols = resolveColumns(rawRows, options.columns);

  if (cols.length === 0) return '';

  const headerLine = cols.map((c) => escapeCsvCell(c.header)).join(',');
  const rowLines = rawRows.map((row) => {
    return cols.map((c) => escapeCsvCell(c.getValue(row))).join(',');
  });

  const content = [headerLine, ...rowLines].join('\r\n');
  const bom = options.includeBOM !== false ? '\uFEFF' : '';
  return bom + content;
}

/**
 * Download CSV file in browser
 */
export function exportToCsv<TData>(options: ExportCsvOptions<TData>): void {
  if (typeof window === 'undefined') return;

  const { filename = 'table-export.csv' } = options;
  const csvContent = generateCsv(options);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate TSV (Tab-Separated Values) string and copy to clipboard
 */
export async function copyToClipboardAsTsv<TData>(
  options: CopyTsvOptions<TData>
): Promise<boolean> {
  const rawRows = extractRawRows(options.data);
  const cols = resolveColumns(rawRows, options.columns);

  if (cols.length === 0) return false;

  const headerLine = cols.map((c) => escapeTsvCell(c.header)).join('\t');
  const rowLines = rawRows.map((row) => {
    return cols.map((c) => escapeTsvCell(c.getValue(row))).join('\t');
  });

  const tsv = [headerLine, ...rowLines].join('\n');

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy TSV to clipboard:', err);
    return false;
  }
}

/**
 * Generate Excel (.xlsx) Blob from table records
 */
export async function generateExcelBlob<TData>(
  options: Omit<ExportExcelOptions<TData>, 'filename'>
): Promise<Blob> {
  const rawRows = extractRawRows(options.data);
  const cols = resolveColumns(rawRows, options.columns);

  if (cols.length === 0) {
    throw new Error('No columns resolved for Excel export');
  }

  const headerBg = options.headerStyle?.backgroundColor ?? '#f1f5f9';
  const headerFont = options.headerStyle?.fontWeight ?? 'bold';
  const headerColor = options.headerStyle?.color;

  const headerRow: ExcelRow = cols.map((c) => ({
    value: c.header,
    fontWeight: headerFont,
    backgroundColor: headerBg,
    color: headerColor,
  }));

  const colWidths: number[] = cols.map((c) => Math.max(c.header.length + 4, 12));

  const dataRows: ExcelRow[] = rawRows.map((row) => {
    return cols.map((col, colIdx) => {
      const val = col.getValue(row);
      if (val === null || val === undefined) {
        return { value: '' };
      }
      if (typeof val === 'number') {
        if (!Number.isFinite(val)) {
          return {
            value: String(val),
            type: String,
          };
        }
        const numStr = String(val);
        colWidths[colIdx] = Math.max(colWidths[colIdx] ?? 12, numStr.length + 3);
        return {
          value: val,
          type: Number,
          format: Number.isInteger(val) ? '#,##0' : '#,##0.00',
        };
      }
      if (val instanceof Date) {
        if (Number.isNaN(val.getTime())) {
          return {
            value: '',
            type: String,
          };
        }
        colWidths[colIdx] = Math.max(colWidths[colIdx] ?? 12, 12);
        return {
          value: val,
          type: Date,
          format: 'yyyy-mm-dd',
        };
      }
      if (typeof val === 'boolean') {
        return {
          value: val,
          type: Boolean,
        };
      }

      const strVal = String(val);
      colWidths[colIdx] = Math.min(Math.max(colWidths[colIdx], strVal.length + 2), 50);
      return {
        value: strVal,
        type: String,
      };
    });
  });

  const sheetData = [headerRow, ...dataRows];
  const columnsOptions = colWidths.map((width) => ({ width }));

  const file = writeXlsxFile(sheetData, {
    columns: columnsOptions,
    sheet: options.sheetName,
  });

  return await file.toBlob();
}

/**
 * Download Excel (.xlsx) file in browser
 */
export async function exportToExcel<TData>(options: ExportExcelOptions<TData>): Promise<void> {
  const { filename = 'table-export.xlsx' } = options;
  const blob = await generateExcelBlob(options);

  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
