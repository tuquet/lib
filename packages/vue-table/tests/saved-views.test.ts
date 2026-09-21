import type { ColumnDef } from '@tanstack/vue-table';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useSavedViews } from '../src/composables/useSavedViews.js';
import { useRemoteTable } from '../src/composables/useRemoteTable.js';

interface TestUser {
  id: string;
  name: string;
  status: string;
}

const columns: ColumnDef<TestUser, any>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
];

const mockUsers: TestUser[] = [
  { id: '1', name: 'Alice', status: 'active' },
  { id: '2', name: 'Bob', status: 'inactive' },
];

describe('VIP Feature: Saved Views & Layout Presets Manager', () => {
  it('creates, updates, and deletes saved views via useSavedViews', () => {
    const onApply = vi.fn();
    const savedViews = useSavedViews({
      onApplyView: onApply,
    });

    expect(savedViews.views.value.length).toBe(0);
    expect(savedViews.activeViewId.value).toBeNull();

    // 1. Save new view
    const view1 = savedViews.saveView('Pending Orders', {
      columnVisibility: { status: false },
      pageSize: 25,
      sorting: [{ id: 'name', desc: true }],
    });

    expect(savedViews.views.value.length).toBe(1);
    expect(view1.name).toBe('Pending Orders');
    expect(savedViews.activeViewId.value).toBe(view1.id);
    expect(savedViews.activeView.value?.name).toBe('Pending Orders');

    // 2. Update view
    savedViews.updateView(view1.id, {
      columnVisibility: { status: true },
      pageSize: 50,
    });
    expect(savedViews.activeView.value?.state.pageSize).toBe(50);

    // 3. Reset to default
    savedViews.resetToDefault();
    expect(savedViews.activeViewId.value).toBeNull();
    expect(savedViews.activeView.value).toBeUndefined();

    // 4. Apply view
    savedViews.applyView(view1.id);
    expect(savedViews.activeViewId.value).toBe(view1.id);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ id: view1.id }));

    // 5. Delete view
    savedViews.deleteView(view1.id);
    expect(savedViews.views.value.length).toBe(0);
    expect(savedViews.activeViewId.value).toBeNull();
  });

  it('integrates saved views with useRemoteTable and TableApi.views', async () => {
    const remote = useRemoteTable<TestUser>({
      columns,
      fetcher: async () => ({ data: mockUsers, total: mockUsers.length }),
      defaultPageSize: 10,
    });

    await nextTick();

    const viewsApi = remote.api.views;
    expect(viewsApi).toBeDefined();

    // Change some state
    remote.api.column.setVisible('status', false);
    remote.api.pagination.setPageSize(20);

    // Save current view
    const saved = viewsApi?.saveView('Custom Layout');
    expect(saved?.state.columnVisibility?.status).toBe(false);
    expect(saved?.state.pageSize).toBe(20);

    // Reset pagination
    remote.api.pagination.setPageSize(10);
    expect(remote.api.pagination.getPageSize()).toBe(10);

    // Re-apply custom view
    if (saved) {
      viewsApi?.applyView(saved.id);
      expect(remote.api.pagination.getPageSize()).toBe(20);
    }
  });
});
