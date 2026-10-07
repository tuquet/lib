import { describe, expect, it, vi } from 'vitest';
import { createSelectionColumn } from '../src/helpers/selection.js';

describe('createSelectionColumn', () => {
  it('creates selection column definition with default options', () => {
    const col = createSelectionColumn();
    expect(col.id).toBe('select');
    expect(col.enableSorting).toBe(false);
    expect(col.enableHiding).toBe(false);
    expect(col.size).toBe(40);
  });

  it('allows custom id and aria labels', () => {
    const col = createSelectionColumn({
      id: 'customSelect',
      headerAriaLabel: 'Custom Select All',
    });
    expect(col.id).toBe('customSelect');
  });

  it('renders header checkbox with all rows selected state', () => {
    const col = createSelectionColumn();
    const mockTable = {
      getIsAllPageRowsSelected: vi.fn(() => true),
      getIsSomePageRowsSelected: vi.fn(() => false),
      toggleAllPageRowsSelected: vi.fn(),
    };

    if (typeof col.header === 'function') {
      const vnode = col.header({ table: mockTable as any } as any);
      expect(vnode).toBeDefined();
      expect(vnode.props?.checked).toBe(true);

      // Trigger update:checked
      vnode.props?.['onUpdate:checked'](false);
      expect(mockTable.toggleAllPageRowsSelected).toHaveBeenCalledWith(false);
    }
  });

  it('renders header checkbox with indeterminate state when some rows are selected', () => {
    const col = createSelectionColumn();
    const mockTable = {
      getIsAllPageRowsSelected: vi.fn(() => false),
      getIsSomePageRowsSelected: vi.fn(() => true),
      toggleAllPageRowsSelected: vi.fn(),
    };

    if (typeof col.header === 'function') {
      const vnode = col.header({ table: mockTable as any } as any);
      expect(vnode.props?.checked).toBe('indeterminate');
    }
  });

  it('renders cell checkbox and checks selection state', () => {
    const col = createSelectionColumn();
    const mockRow = {
      index: 0,
      getIsSelected: vi.fn(() => true),
      toggleSelected: vi.fn(),
    };

    if (typeof col.cell === 'function') {
      const vnode = col.cell({ row: mockRow as any } as any);
      expect(vnode.props?.checked).toBe(true);
      expect(vnode.props?.disabled).toBe(false);

      vnode.props?.['onUpdate:checked'](false);
      expect(mockRow.toggleSelected).toHaveBeenCalledWith(false);
    }
  });

  it('disables cell checkbox when isRowSelectable returns false', () => {
    const col = createSelectionColumn<{ id: number; disabled: boolean }>({
      isRowSelectable: (row) => !row.original.disabled,
    });

    const mockRowDisabled = {
      index: 0,
      original: { id: 1, disabled: true },
      getIsSelected: vi.fn(() => false),
      toggleSelected: vi.fn(),
    };

    if (typeof col.cell === 'function') {
      const vnode = col.cell({ row: mockRowDisabled as any } as any);
      expect(vnode.props?.disabled).toBe(true);
    }
  });
});
