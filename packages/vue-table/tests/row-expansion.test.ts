import type { ColumnDef } from '@tanstack/vue-table';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { useRemoteTable } from '../src/composables/useRemoteTable.js';
import DataTable from '../src/components/DataTable.vue';

interface TestOrder {
  id: string;
  orderNumber: string;
  customer: string;
  itemsCount: number;
}

const columns: ColumnDef<TestOrder, any>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'orderNumber', header: 'Order #' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'itemsCount', header: 'Items' },
];

const mockOrders: TestOrder[] = [
  { id: 'ord_1', orderNumber: 'ORD-101', customer: 'Acme Corp', itemsCount: 3 },
  { id: 'ord_2', orderNumber: 'ORD-102', customer: 'Beta Ltd', itemsCount: 5 },
];

describe('VIP Feature: Row Expansion & Master-Detail', () => {
  it('toggles row expansion and updates state in useRemoteTable', async () => {
    const remote = useRemoteTable<TestOrder>({
      columns,
      fetcher: async () => ({ data: mockOrders, total: mockOrders.length }),
      getRowId: (row) => row.id,
      enableRowExpansion: true,
    });

    await nextTick();

    expect(remote.expanded.value).toEqual({});
    expect(remote.isRowExpanded('ord_1')).toBe(false);

    // Toggle expansion on ord_1
    remote.toggleRowExpanded('ord_1');
    expect(remote.isRowExpanded('ord_1')).toBe(true);

    // Toggle back
    remote.toggleRowExpanded('ord_1');
    expect(remote.isRowExpanded('ord_1')).toBe(false);

    // Expand all
    remote.expandAll();
    expect(remote.isRowExpanded('ord_1')).toBe(true);
    expect(remote.isRowExpanded('ord_2')).toBe(true);

    // Collapse all
    remote.collapseAll();
    expect(remote.isRowExpanded('ord_1')).toBe(false);
    expect(remote.isRowExpanded('ord_2')).toBe(false);
  });

  it('provides expansion facade via TableApi', async () => {
    const remote = useRemoteTable<TestOrder>({
      columns,
      fetcher: async () => ({ data: mockOrders, total: mockOrders.length }),
      getRowId: (row) => row.id,
    });

    const expansionApi = remote.api.expansion;
    expect(expansionApi).toBeDefined();

    expansionApi?.toggleRowExpanded('ord_2');
    expect(expansionApi?.isRowExpanded('ord_2')).toBe(true);

    expansionApi?.collapseAll();
    expect(expansionApi?.isRowExpanded('ord_2')).toBe(false);
  });

  it('exports valid DataTable component with expansion contract', () => {
    expect(DataTable).toBeDefined();
    expect(typeof DataTable).toBe('object');
    expect(DataTable).toHaveProperty('setup');
  });
});
