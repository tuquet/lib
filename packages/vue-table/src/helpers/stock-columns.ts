import type { ColumnDef, Row } from '@tanstack/vue-table';
import { h } from 'vue';
import StockTickerCell from '../components/StockTickerCell.vue';

export interface BaseStockRow {
  symbol: string;
  referencePrice?: number;
  ceilingPrice?: number;
  floorPrice?: number;
  [key: string]: any;
}

export interface StockPriceColumnOptions<TData extends BaseStockRow> {
  id?: string;
  accessorKey?: keyof TData & string;
  header?: string;
  size?: number;
  showArrow?: boolean;
  decimalPlaces?: number;
  formatter?: (val: number) => string;
}

export interface StockChangeColumnOptions<TData extends BaseStockRow> {
  id?: string;
  accessorKey?: keyof TData & string;
  header?: string;
  size?: number;
  showPercent?: boolean;
  decimalPlaces?: number;
}

/**
 * Creates a ColumnDef for stock ticker symbols (e.g., VNM, HPG, FPT)
 */
export function createStockSymbolColumn<TData extends BaseStockRow>(
  options: { id?: string; accessorKey?: keyof TData & string; header?: string; size?: number } = {}
): ColumnDef<TData, any> {
  const { id = 'symbol', accessorKey = 'symbol', header = 'Mã CK', size = 80 } = options;

  return {
    id,
    accessorKey,
    header,
    size,
    enableSorting: true,
    cell: ({ row }: { row: Row<TData> }) => {
      const symbol = (row?.getValue(id) as string) ?? '';
      return h(
        'span',
        { class: 'font-mono font-bold text-xs uppercase tracking-wider text-primary' },
        symbol
      );
    },
  };
}

/**
 * Creates a ColumnDef for realtime stock prices with built-in color-coding and flash effect.
 */
export function createStockPriceColumn<TData extends BaseStockRow>(
  options: StockPriceColumnOptions<TData> = {}
): ColumnDef<TData, any> {
  const {
    id = 'price',
    accessorKey = 'price',
    header = 'Giá khớp',
    size = 90,
    showArrow = true,
    decimalPlaces = 2,
    formatter,
  } = options;

  return {
    id,
    accessorKey,
    header,
    size,
    enableSorting: true,
    cell: ({ row }: { row: Row<TData> }) => {
      const price = Number(row?.getValue(id) ?? 0);
      const original = (row?.original ?? {}) as BaseStockRow;

      return h(StockTickerCell, {
        value: price,
        referencePrice: original.referencePrice,
        ceilingPrice: original.ceilingPrice,
        floorPrice: original.floorPrice,
        showArrow,
        decimalPlaces,
        formatter,
        align: 'right',
      });
    },
  };
}

/**
 * Creates a ColumnDef for price change (+/- and optional %)
 */
export function createStockChangeColumn<TData extends BaseStockRow>(
  options: StockChangeColumnOptions<TData> = {}
): ColumnDef<TData, any> {
  const {
    id = 'change',
    accessorKey = 'change',
    header = '+/-',
    size = 85,
    showPercent = false,
    decimalPlaces = 2,
  } = options;

  return {
    id,
    accessorKey,
    header,
    size,
    enableSorting: true,
    cell: ({ row }: { row: Row<TData> }) => {
      const changeVal = Number(row?.getValue(id) ?? 0);
      const original = (row?.original ?? {}) as BaseStockRow;

      const formatted = showPercent
        ? `${changeVal > 0 ? '+' : ''}${changeVal.toFixed(decimalPlaces)}%`
        : undefined;

      return h(StockTickerCell, {
        value: changeVal,
        referencePrice: 0, // change > 0 is up, change < 0 is down
        showSign: true,
        decimalPlaces,
        formatter: formatted ? () => formatted : undefined,
        align: 'right',
      });
    },
  };
}

/**
 * Utility to format stock volume into human readable string (e.g., 1,500,000 or 1.5M)
 */
export function formatStockVolume(volume: number, compact = false): string {
  if (volume === undefined || volume === null || isNaN(volume)) return '0';
  if (compact && volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (compact && volume >= 1_000) {
    return `${(volume / 1_000).toFixed(0)}K`;
  }
  return volume.toLocaleString('vi-VN');
}
