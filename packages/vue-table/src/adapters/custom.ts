import type { QueryAdapter, TableState } from '../types/index.js';

export interface CustomAdapterOptions {
  name?: string;
  serialize: (state: TableState) => Record<string, unknown>;
  deserialize: (query: Record<string, unknown>) => Partial<TableState>;
}

export function createCustomAdapter(options: CustomAdapterOptions): QueryAdapter {
  return {
    name: options.name ?? 'custom',
    serialize: options.serialize,
    deserialize: options.deserialize,
  };
}
