import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useRemoteInfiniteSelect } from '../src/composables/useRemoteInfiniteSelect.js';

interface Item {
  id: string;
  name: string;
  isSystem?: boolean;
}

const mockDatabase: Item[] = Array.from({ length: 15 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: `Item ${i + 1}`,
  isSystem: i === 0,
}));

describe('useRemoteInfiniteSelect', () => {
  const createSelect = (
    options: Partial<Parameters<typeof useRemoteInfiniteSelect<Item>>[0]> = {}
  ) => {
    return useRemoteInfiniteSelect<Item>({
      fetcher: vi.fn(async ({ page, pageSize, search }) => {
        let filtered = [...mockDatabase];
        if (search) {
          filtered = filtered.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()));
        }
        const start = (page - 1) * pageSize;
        const pageData = filtered.slice(start, start + pageSize);
        return {
          data: pageData,
          total: filtered.length,
          hasMore: start + pageSize < filtered.length,
        };
      }),
      pageSize: 5,
      debounceMs: 0,
      valueKey: 'id',
      labelKey: 'name',
      ...options,
    });
  };

  it('loads first page and handles pagination via loadMore', async () => {
    const select = createSelect();
    await select.refresh();

    expect(select.items.value).toHaveLength(5);
    expect(select.total.value).toBe(15);
    expect(select.hasMore.value).toBe(true);
    expect(select.items.value[0]?.id).toBe('item-1');

    // Load page 2
    await select.loadMore();
    expect(select.items.value).toHaveLength(10);
    expect(select.items.value[9]?.id).toBe('item-10');
    expect(select.hasMore.value).toBe(true);

    // Load page 3 (last page)
    await select.loadMore();
    expect(select.items.value).toHaveLength(15);
    expect(select.hasMore.value).toBe(false);

    // Further loadMore should not fetch
    await select.loadMore();
    expect(select.items.value).toHaveLength(15);
  });

  it('filters items via search query and resets pagination', async () => {
    const select = createSelect();
    await select.refresh();

    select.setSearch('Item 1');
    // Wait for search to execute
    await new Promise((r) => setTimeout(r, 10));

    // Should match Item 1, Item 10, Item 11, Item 12, Item 13, Item 14, Item 15 (7 items)
    expect(select.total.value).toBe(7);
    expect(select.items.value).toHaveLength(5); // first page has 5

    // Clearing search restores all
    select.setSearch('');
    await new Promise((r) => setTimeout(r, 10));
    expect(select.total.value).toBe(15);
  });

  it('hydrates initial selection when item is not in initial page', async () => {
    const resolveValue = vi.fn(async (id: string | number) => {
      return { id: String(id), name: `Resolved Name ${id}` };
    });

    const modelValue = ref('item-99');
    const select = createSelect({
      modelValue,
      resolveValue,
    });

    await select.refresh();

    expect(resolveValue).toHaveBeenCalledWith('item-99');
    expect(select.resolvedItem.value?.name).toBe('Resolved Name item-99');
  });

  it('handles onCreate hook by prepending new item and auto-selecting', async () => {
    const onCreate = vi.fn(async (input: string) => {
      return { id: 'item-new', name: input };
    });

    const modelValue = ref<string | undefined>();
    const select = createSelect({
      modelValue,
      onCreate,
    });
    await select.refresh();

    expect(select.items.value).toHaveLength(5);
    expect(select.total.value).toBe(15);

    const created = await select.createItem('Brand New Item');

    expect(onCreate).toHaveBeenCalledWith('Brand New Item');
    expect(created).toBeDefined();
    expect(select.items.value[0]?.id).toBe('item-new');
    expect(select.items.value).toHaveLength(6);
    expect(select.total.value).toBe(16);
    expect(modelValue.value).toBe('item-new');
  });

  it('handles onDelete hook and unselects active value if deleted', async () => {
    const onDelete = vi.fn(async (_item: Item) => {
      return true;
    });

    const modelValue = ref<string | undefined>('item-2');
    const select = createSelect({
      modelValue,
      onDelete,
    });
    await select.refresh();

    const targetItem = select.items.value.find((it) => it.id === 'item-2')!;
    expect(targetItem).toBeDefined();

    const success = await select.deleteItem(targetItem);

    expect(success).toBe(true);
    expect(onDelete).toHaveBeenCalledWith(targetItem);
    // Item removed from list
    expect(select.items.value.find((it) => it.id === 'item-2')).toBeUndefined();
    expect(select.total.value).toBe(14);
    // Active modelValue was unselected
    expect(modelValue.value).toBeUndefined();
  });

  it('rolls back deletion if onDelete fails or returns false', async () => {
    const onDelete = vi.fn(async () => false);

    const select = createSelect({ onDelete });
    await select.refresh();

    const target = select.items.value[0]!;
    const success = await select.deleteItem(target);

    expect(success).toBe(false);
    // Item is preserved
    expect(select.items.value[0]?.id).toBe(target.id);
    expect(select.total.value).toBe(15);
  });
});
