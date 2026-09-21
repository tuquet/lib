import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  type ComputedRef,
  type ShallowRef,
} from 'vue';

export type SSEConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface SSEStreamReconnectOptions {
  /**
   * Whether auto-reconnect is enabled. Default: true
   */
  enabled?: boolean;
  /**
   * Initial delay in milliseconds before reconnecting. Default: 1000ms
   */
  initialDelayMs?: number;
  /**
   * Maximum delay in milliseconds (capped exponential backoff). Default: 30000ms
   */
  maxDelayMs?: number;
  /**
   * Maximum number of retry attempts before giving up. Default: Infinity
   */
  maxRetries?: number;
}

export interface SSEStreamOptions<TData = any, TTick = Partial<TData>> {
  /**
   * The SSE endpoint URL
   */
  url?: string;
  /**
   * Whether to automatically connect on initialization. Default: true
   */
  autoConnect?: boolean;
  /**
   * Micro-batching window in milliseconds.
   * Ticks arriving within this window are accumulated in a Map by their key
   * and dispatched in a single batch to avoid multiple reactivity flushes.
   * Default: 33ms (~30 FPS)
   */
  batchIntervalMs?: number;
  /**
   * Key extractor to identify which row/entity a tick belongs to.
   * Default: (tick: any) => tick.symbol ?? tick.id
   */
  getTickKey?: (tick: TTick) => string;
  /**
   * Parser for incoming SSE MessageEvent.
   * Default: JSON.parse(event.data)
   */
  parseMessage?: (event: MessageEvent) => TTick | TTick[] | null;
  /**
   * Custom EventSource factory (useful for testing or custom headers/polyfills).
   */
  eventSourceFactory?: (url: string) => EventSource;
  /**
   * Callback invoked whenever a micro-batch of ticks is ready to be applied.
   * Provides a Map of key -> merged tick updates.
   */
  onBatch?: (batch: Map<string, TTick>) => void;
  /**
   * Optional direct mutation handler from `useTableMutations`.
   * If provided, automatically updates the matching row for each tick in the batch.
   */
  mutateRow?: (id: string, updater: (old: TData) => TData) => void;
  /**
   * Reconnect configuration
   */
  reconnect?: SSEStreamReconnectOptions;
  /**
   * SSE event name to listen to. Default: 'message'
   */
  eventName?: string;
}

export interface SSEStreamMetrics {
  /**
   * Number of incoming ticks received per second (calculated over 1-second rolling windows).
   */
  ticksPerSecond: number;
  /**
   * Total number of ticks received since connection started.
   */
  totalTicksReceived: number;
  /**
   * Current number of pending unique symbols waiting in the micro-batch queue.
   */
  bufferQueueSize: number;
  /**
   * Total number of batch flushes dispatched.
   */
  batchesDispatched: number;
  /**
   * Timestamp of the most recently received tick.
   */
  lastTickTimestamp: number | null;
}

export interface UseTableSSEStreamReturn<TTick> {
  /**
   * Current connection status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
   */
  status: ShallowRef<SSEConnectionStatus>;
  /**
   * Realtime streaming metrics (ticks/sec, totals, buffer size)
   */
  metrics: ShallowRef<SSEStreamMetrics>;
  /**
   * Helper boolean indicating if connection is active and receiving ticks
   */
  isConnected: ComputedRef<boolean>;
  /**
   * Connects to the SSE endpoint
   */
  connect: (targetUrl?: string) => void;
  /**
   * Disconnects and cleans up all timers
   */
  disconnect: () => void;
  /**
   * Reconnects immediately
   */
  reconnect: () => void;
  /**
   * Manually ingest one or more ticks into the micro-batching buffer.
   * Useful for testing, WebSockets, or custom messaging bridges.
   */
  pushTick: (tick: TTick | TTick[]) => void;
  /**
   * Immediately flushes the pending buffer without waiting for the timer.
   */
  flush: () => void;
}

export function useTableSSEStream<TData = any, TTick = Partial<TData>>(
  options: SSEStreamOptions<TData, TTick> = {}
): UseTableSSEStreamReturn<TTick> {
  const {
    url: initialUrl,
    autoConnect = true,
    batchIntervalMs = 33,
    getTickKey = (tick: any) => String(tick?.symbol ?? tick?.id ?? ''),
    parseMessage = (event: MessageEvent) => {
      try {
        return JSON.parse(event.data);
      } catch {
        return null;
      }
    },
    eventSourceFactory,
    onBatch,
    mutateRow,
    reconnect = {},
    eventName = 'message',
  } = options;

  const {
    enabled: reconnectEnabled = true,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    maxRetries = Infinity,
  } = reconnect;

  let activeUrl = initialUrl;
  let eventSource: EventSource | null = null;
  let batchTimerId: ReturnType<typeof setInterval> | null = null;
  let metricsTimerId: ReturnType<typeof setInterval> | null = null;
  let reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  let retryCount = 0;
  let ticksSinceLastMetric = 0;

  // Micro-batching Map: symbol/key -> latest accumulated partial tick
  const tickBuffer = new Map<string, TTick>();

  const status = shallowRef<SSEConnectionStatus>('disconnected');
  const metrics = shallowRef<SSEStreamMetrics>({
    ticksPerSecond: 0,
    totalTicksReceived: 0,
    bufferQueueSize: 0,
    batchesDispatched: 0,
    lastTickTimestamp: null,
  });

  const isConnected = computed(() => status.value === 'connected');

  /**
   * Ingest a single tick or array of ticks into the buffer
   */
  function pushTick(tickOrTicks: TTick | TTick[]) {
    const items = Array.isArray(tickOrTicks) ? tickOrTicks : [tickOrTicks];
    if (items.length === 0) return;

    const now = Date.now();
    for (const item of items) {
      if (!item) continue;
      const key = getTickKey(item);
      if (!key) continue;

      const existing = tickBuffer.get(key);
      if (existing && typeof existing === 'object' && typeof item === 'object') {
        tickBuffer.set(key, { ...existing, ...item });
      } else {
        tickBuffer.set(key, item);
      }
      ticksSinceLastMetric++;
    }

    const currentTotal = metrics.value.totalTicksReceived + items.length;
    metrics.value = {
      ...metrics.value,
      totalTicksReceived: currentTotal,
      bufferQueueSize: tickBuffer.size,
      lastTickTimestamp: now,
    };
  }

  /**
   * Flush the pending buffer to consumers
   */
  function flush() {
    if (tickBuffer.size === 0) return;

    const batch = new Map(tickBuffer);
    tickBuffer.clear();

    // 1. Invoke custom batch callback
    if (onBatch) {
      onBatch(batch);
    }

    // 2. Automatically apply to mutateRow if available
    if (mutateRow) {
      batch.forEach((update, key) => {
        mutateRow(key, (old: TData) => {
          if (old && typeof old === 'object' && typeof update === 'object') {
            return { ...old, ...update };
          }
          return (update as unknown as TData) ?? old;
        });
      });
    }

    metrics.value = {
      ...metrics.value,
      bufferQueueSize: 0,
      batchesDispatched: metrics.value.batchesDispatched + 1,
    };
  }

  function scheduleReconnect() {
    if (!reconnectEnabled || retryCount >= maxRetries) {
      status.value = 'disconnected';
      return;
    }

    status.value = 'reconnecting';
    const delay = Math.min(initialDelayMs * Math.pow(1.5, retryCount), maxDelayMs);
    retryCount++;

    if (reconnectTimerId) clearTimeout(reconnectTimerId);
    reconnectTimerId = setTimeout(() => {
      if (activeUrl && status.value === 'reconnecting') {
        connect(activeUrl);
      }
    }, delay);
  }

  function handleMessage(event: MessageEvent) {
    const parsed = parseMessage(event);
    if (parsed) {
      pushTick(parsed);
    }
  }

  function connect(targetUrl?: string) {
    if (targetUrl) {
      activeUrl = targetUrl;
    }
    if (!activeUrl) return;

    disconnect();
    status.value = 'connecting';

    try {
      if (eventSourceFactory) {
        eventSource = eventSourceFactory(activeUrl);
      } else if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource(activeUrl);
      } else {
        console.warn('[useTableSSEStream] EventSource is not supported in this environment');
        status.value = 'disconnected';
        return;
      }

      eventSource.onopen = () => {
        status.value = 'connected';
        retryCount = 0;
      };

      eventSource.addEventListener(eventName, handleMessage as EventListener);

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        scheduleReconnect();
      };

      // Start micro-batching flush timer
      if (!batchTimerId) {
        batchTimerId = setInterval(flush, batchIntervalMs);
      }

      // Start rolling 1s metrics timer for ticks/sec
      if (!metricsTimerId) {
        metricsTimerId = setInterval(() => {
          metrics.value = {
            ...metrics.value,
            ticksPerSecond: ticksSinceLastMetric,
          };
          ticksSinceLastMetric = 0;
        }, 1000);
      }
    } catch (err) {
      console.error('[useTableSSEStream] Connection error', err);
      scheduleReconnect();
    }
  }

  function disconnect() {
    if (reconnectTimerId) {
      clearTimeout(reconnectTimerId);
      reconnectTimerId = null;
    }
    if (eventSource) {
      eventSource.removeEventListener(eventName, handleMessage as EventListener);
      eventSource.close();
      eventSource = null;
    }
    if (batchTimerId) {
      clearInterval(batchTimerId);
      batchTimerId = null;
    }
    if (metricsTimerId) {
      clearInterval(metricsTimerId);
      metricsTimerId = null;
    }
    flush(); // Flush any remaining items before disconnecting
    status.value = 'disconnected';
  }

  function manualReconnect() {
    retryCount = 0;
    connect(activeUrl);
  }

  if (autoConnect && activeUrl) {
    connect(activeUrl);
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disconnect();
      tickBuffer.clear();
    });
  }

  return {
    status,
    metrics,
    isConnected,
    connect,
    disconnect,
    reconnect: manualReconnect,
    pushTick,
    flush,
  };
}
