import type { ColumnDef } from '@tanstack/vue-table';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { useRemoteTable } from '../src/composables/useRemoteTable.js';
import DataTableColumnHeaderMenu from '../src/components/DataTableColumnHeaderMenu.vue';
import { DataTableColumnHeaderMenu as ExportedHeaderMenu } from '../src/index.js';

interface TestUser {
  id: string;
  name: string;
}

const columns: ColumnDef<TestUser, any>[] = [
  { accessorKey: 'id', header: 'ID', enableSorting: true },
  { accessorKey: 'name', header: 'User Name', enableSorting: true },
];

describe('VIP Feature: Column Header Action Menu', () => {
  it('is exported correctly from package root and components index', () => {
    expect(DataTableColumnHeaderMenu).toBeDefined();
    expect(ExportedHeaderMenu).toBeDefined();
    expect(DataTableColumnHeaderMenu).toBe(ExportedHeaderMenu);
    expect(typeof DataTableColumnHeaderMenu).toBe('object');
    expect(DataTableColumnHeaderMenu).toHaveProperty('setup');
  });

  it('provides column manipulation methods used by the header menu', async () => {
    const remote = useRemoteTable<TestUser>({
      columns,
      fetcher: async () => ({ data: [], total: 0 }),
    });

    await nextTick();

    const column = remote.table.getColumn('name')!;
    expect(column).toBeDefined();

    // 1. Sorting operations
    expect(column.getCanSort()).toBe(true);
    expect(column.getIsSorted()).toBe(false);

    column.toggleSorting(false); // asc
    expect(column.getIsSorted()).toBe('asc');

    column.toggleSorting(true); // desc
    expect(column.getIsSorted()).toBe('desc');

    column.clearSorting();
    expect(column.getIsSorted()).toBe(false);

    // 2. Pinning operations
    expect(column.getCanPin()).toBe(true);
    expect(column.getIsPinned()).toBe(false);

    column.pin('left');
    expect(column.getIsPinned()).toBe('left');

    column.pin(false);
    expect(column.getIsPinned()).toBe(false);

    // 3. Visibility operations
    expect(column.getCanHide()).toBe(true);
    expect(column.getIsVisible()).toBe(true);

    column.toggleVisibility(false);
    expect(column.getIsVisible()).toBe(false);

    column.toggleVisibility(true);
    expect(column.getIsVisible()).toBe(true);
  });
});
