import type { ColumnDef, Row } from '@tanstack/vue-table';
import {
  copyToClipboardAsTsv,
  exportToCsv,
  exportToExcel,
  type CopyTsvOptions,
  type ExportCsvOptions,
  type ExportExcelOptions,
} from '../helpers/export.js';
import type { ExportApi } from './types.js';

export interface CreateExportApiOptions<TData> {
  getData: () => (TData | Row<TData>)[];
  getColumns: () => ColumnDef<TData, any>[];
}

export function createExportApi<TData>(options: CreateExportApiOptions<TData>): ExportApi<TData> {
  const { getData, getColumns } = options;

  return {
    toCsv(filename?: string, customOptions?: Partial<ExportCsvOptions<TData>>): void {
      exportToCsv({
        data: getData(),
        columns: getColumns(),
        filename: filename || 'export.csv',
        ...customOptions,
      });
    },

    async toExcel(
      filename?: string,
      customOptions?: Partial<ExportExcelOptions<TData>>
    ): Promise<void> {
      await exportToExcel({
        data: getData(),
        columns: getColumns(),
        filename: filename || 'export.xlsx',
        ...customOptions,
      });
    },

    async toClipboardTsv(customOptions?: Partial<CopyTsvOptions<TData>>): Promise<boolean> {
      return copyToClipboardAsTsv({
        data: getData(),
        columns: getColumns(),
        ...customOptions,
      });
    },
  };
}
