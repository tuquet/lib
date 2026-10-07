import type { TableState } from './core.js';

export interface QueryAdapter {
  name: string;
  serialize: (state: TableState) => Record<string, unknown>;
  deserialize: (query: Record<string, unknown>) => Partial<TableState>;
}
