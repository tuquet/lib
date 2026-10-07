import { describe, expect, it, vi } from 'vitest';
import { useTableSSEStream } from '../src/composables/useTableSSEStream.js';
import { useCellFlash } from '../src/composables/useCellFlash.js';
import {
  createStockSymbolColumn,
  createStockPriceColumn,
  createStockChangeColumn,
  formatStockVolume,
} from '../src/helpers/stock-columns.js';

describe('useTableSSEStream Micro-Batching Engine', () => {
  it('initializes with disconnected state and default metrics', () => {
    const stream = useTableSSEStream({ autoConnect: false });
    expect(stream.status.value).toBe('disconnected');
    expect(stream.isConnected.value).toBe(false);
    expect(stream.metrics.value.totalTicksReceived).toBe(0);
    expect(stream.metrics.value.bufferQueueSize).toBe(0);
    expect(stream.metrics.value.batchesDispatched).toBe(0);
  });

  it('accumulates and merges multiple ticks for the same symbol in buffer', () => {
    const onBatch = vi.fn();
    const stream = useTableSSEStream({
      autoConnect: false,
      onBatch,
    });

    // Ingest 3 ticks for VNM and 1 for HPG
    stream.pushTick({ symbol: 'VNM', price: 72.5, volume: 1000 });
    stream.pushTick({ symbol: 'VNM', price: 73.0 }); // price updated
    stream.pushTick({ symbol: 'HPG', price: 28.1, volume: 5000 });

    expect(stream.metrics.value.totalTicksReceived).toBe(3);
    expect(stream.metrics.value.bufferQueueSize).toBe(2);

    // Trigger flush
    stream.flush();

    expect(onBatch).toHaveBeenCalledTimes(1);
    const batchArg = onBatch.mock.calls[0][0] as Map<string, any>;
    expect(batchArg.size).toBe(2);

    // VNM should have merged price 73.0 and volume 1000
    const vnm = batchArg.get('VNM');
    expect(vnm).toEqual({ symbol: 'VNM', price: 73.0, volume: 1000 });

    const hpg = batchArg.get('HPG');
    expect(hpg).toEqual({ symbol: 'HPG', price: 28.1, volume: 5000 });

    // Buffer should be cleared after flush
    expect(stream.metrics.value.bufferQueueSize).toBe(0);
    expect(stream.metrics.value.batchesDispatched).toBe(1);
  });

  it('automatically invokes mutateRow for each symbol in the batch', () => {
    const mutateRow = vi.fn();
    const stream = useTableSSEStream({
      autoConnect: false,
      mutateRow,
    });

    stream.pushTick([
      { symbol: 'FPT', price: 135.0, change: 2.5 },
      { symbol: 'MWG', price: 65.2, change: -0.8 },
    ]);

    stream.flush();

    expect(mutateRow).toHaveBeenCalledTimes(2);
    expect(mutateRow).toHaveBeenCalledWith('FPT', expect.any(Function));
    expect(mutateRow).toHaveBeenCalledWith('MWG', expect.any(Function));

    // Test updater callback execution
    const fptUpdater = mutateRow.mock.calls.find((c) => c[0] === 'FPT')?.[1];
    const oldFpt = { symbol: 'FPT', price: 132.5, referencePrice: 132.5, change: 0 };
    const updatedFpt = fptUpdater(oldFpt);
    expect(updatedFpt).toEqual({
      symbol: 'FPT',
      price: 135.0,
      referencePrice: 132.5,
      change: 2.5,
    });
  });

  it('supports custom eventSourceFactory mock', () => {
    let mockOnOpen: (() => void) | null = null;
    const mockClose = vi.fn();
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    const mockFactory = vi.fn((url: string) => {
      return {
        url,
        set onopen(cb: () => void) {
          mockOnOpen = cb;
        },
        close: mockClose,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      } as unknown as EventSource;
    });

    const stream = useTableSSEStream({
      url: '/market/hose',
      autoConnect: true,
      eventSourceFactory: mockFactory,
    });

    expect(mockFactory).toHaveBeenCalledWith('/market/hose');
    expect(stream.status.value).toBe('connecting');

    // Simulate connection opened
    if (mockOnOpen) (mockOnOpen as () => void)();
    expect(stream.status.value).toBe('connected');
    expect(stream.isConnected.value).toBe(true);

    // Disconnect
    stream.disconnect();
    expect(mockClose).toHaveBeenCalled();
    expect(stream.status.value).toBe('disconnected');
  });
});

describe('useCellFlash Visual Composable', () => {
  it('manages flashDirection and flashClass on manual trigger', () => {
    vi.useFakeTimers();

    const flash = useCellFlash(() => 100, { durationMs: 300 });
    expect(flash.flashDirection.value).toBe('none');
    expect(flash.flashClass.value).toBe('');

    flash.triggerFlash('up');
    expect(flash.flashDirection.value).toBe('up');
    expect(flash.flashClass.value).toContain('bg-emerald');

    vi.advanceTimersByTime(300);
    expect(flash.flashDirection.value).toBe('none');
    expect(flash.flashClass.value).toBe('');

    flash.triggerFlash('down');
    expect(flash.flashDirection.value).toBe('down');
    expect(flash.flashClass.value).toContain('bg-rose');

    flash.clearFlash();
    expect(flash.flashDirection.value).toBe('none');

    vi.useRealTimers();
  });
});

describe('Stock Column Helpers', () => {
  it('creates stock symbol column with correct defaults', () => {
    const col = createStockSymbolColumn();
    expect(col.id).toBe('symbol');
    expect(col.header).toBe('Mã CK');
    expect(col.enableSorting).toBe(true);
  });

  it('creates stock price column with cell renderer', () => {
    const col = createStockPriceColumn();
    expect(col.id).toBe('price');
    expect(col.header).toBe('Giá khớp');
    expect(typeof col.cell).toBe('function');
  });

  it('creates stock change column with percent option', () => {
    const col = createStockChangeColumn({ showPercent: true });
    expect(col.id).toBe('change');
    expect(col.header).toBe('+/-');
  });

  it('formats stock volume in compact and standard formats', () => {
    expect(formatStockVolume(1500000, true)).toBe('1.5M');
    expect(formatStockVolume(25000, true)).toBe('25K');
    expect(formatStockVolume(500, true)).toBe('500');
    expect(formatStockVolume(1500000, false)).toBe('1.500.000');
  });
});
