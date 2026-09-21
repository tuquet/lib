import { ref, type Ref } from 'vue';
import type { TableCellEditEvent, TablePlugin } from './types.js';

export interface AuditLogEntry<TData = any> extends TableCellEditEvent<TData> {
  id: string;
}

export interface AuditLogPluginOptions<TData = any> {
  maxEntries?: number;
  onLog?: (entry: AuditLogEntry<TData>) => void;
}

export interface AuditLogPluginInstance<TData = any> extends TablePlugin<TData> {
  logs: Ref<AuditLogEntry<TData>[]>;
  clearLogs: () => void;
}

export function createAuditLogPlugin<TData = any>(
  options: AuditLogPluginOptions<TData> = {}
): AuditLogPluginInstance<TData> {
  const { maxEntries = 50, onLog } = options;
  const logs = ref<AuditLogEntry<TData>[]>([]) as Ref<AuditLogEntry<TData>[]>;

  let counter = 1;

  const plugin: AuditLogPluginInstance<TData> = {
    name: 'audit-log',
    order: 10,
    logs,
    clearLogs: () => {
      logs.value = [];
    },
    onCellEdit: (event) => {
      const entry: AuditLogEntry<TData> = {
        id: `audit_${Date.now()}_${counter++}`,
        ...event,
      };

      logs.value = [entry, ...logs.value.slice(0, maxEntries - 1)];

      if (onLog) {
        onLog(entry);
      }
    },
  };

  return plugin;
}
