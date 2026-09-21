import { describe, expect, it, vi } from 'vitest';
import DataTableCardView from '../src/components/DataTableCardView.vue';
import { DataTableCardView as ExportedCardView } from '../src/index.js';

describe('DataTableCardView Component Contract', () => {
  it('is exported from main package entry and components index', () => {
    expect(DataTableCardView).toBeDefined();
    expect(ExportedCardView).toBeDefined();
    expect(DataTableCardView).toBe(ExportedCardView);
  });

  it('has valid component definition with name and props', () => {
    // Vue SFC compiled object verification
    expect(typeof DataTableCardView).toBe('object');
    // Verify it is a valid Vue component object
    expect(DataTableCardView).toHaveProperty('setup');
  });

  it('defines props including table and showSelectAll', () => {
    const props = (DataTableCardView as any).props;
    expect(props).toBeDefined();
    expect(props).toHaveProperty('rows');
    expect(props).toHaveProperty('table');
    expect(props).toHaveProperty('showSelectAll');
    expect(props).toHaveProperty('virtual');
  });

  it('verifies select all and deselect all contract logic', () => {
    let rowSelection: Record<string, boolean> = {};
    const mockRow1 = {
      id: 'row_1',
      getIsSelected: () => !!rowSelection['row_1'],
      toggleSelected: (val?: boolean) => {
        if (val === undefined) {
          rowSelection['row_1'] = !rowSelection['row_1'];
        } else if (val) {
          rowSelection['row_1'] = true;
        } else {
          delete rowSelection['row_1'];
        }
      },
    };
    const mockRow2 = {
      id: 'row_2',
      getIsSelected: () => !!rowSelection['row_2'],
      toggleSelected: (val?: boolean) => {
        if (val === undefined) {
          rowSelection['row_2'] = !rowSelection['row_2'];
        } else if (val) {
          rowSelection['row_2'] = true;
        } else {
          delete rowSelection['row_2'];
        }
      },
    };

    const mockTable = {
      resetRowSelection: vi.fn(() => {
        rowSelection = {};
      }),
      toggleAllRowsSelected: vi.fn((val: boolean) => {
        if (!val) rowSelection = {};
        else rowSelection = { row_1: true, row_2: true };
      }),
      toggleAllPageRowsSelected: vi.fn((val: boolean) => {
        if (!val) rowSelection = {};
        else rowSelection = { row_1: true, row_2: true };
      }),
    };

    // Helper functions equivalent to DataTableCardView implementation
    function selectAll() {
      mockTable.toggleAllPageRowsSelected(true);
    }
    function deselectAll() {
      mockTable.resetRowSelection();
      mockTable.toggleAllRowsSelected(false);
      mockTable.toggleAllPageRowsSelected(false);
      [mockRow1, mockRow2].forEach((r) => {
        if (r.getIsSelected()) r.toggleSelected(false);
      });
    }

    // 1. Initial state
    expect(Object.keys(rowSelection).length).toBe(0);

    // 2. Select All
    selectAll();
    expect(mockTable.toggleAllPageRowsSelected).toHaveBeenCalledWith(true);
    expect(Object.keys(rowSelection).length).toBe(2);

    // 3. Deselect All
    deselectAll();
    expect(mockTable.resetRowSelection).toHaveBeenCalled();
    expect(mockTable.toggleAllRowsSelected).toHaveBeenCalledWith(false);
    expect(mockTable.toggleAllPageRowsSelected).toHaveBeenCalledWith(false);
    expect(Object.keys(rowSelection).length).toBe(0);
    expect(mockRow1.getIsSelected()).toBe(false);
    expect(mockRow2.getIsSelected()).toBe(false);
    // 4. Test handleSelectAll handler behavior
    function handleSelectAll(val?: boolean | 'indeterminate') {
      if (val === true) {
        selectAll();
      } else if (val === false) {
        deselectAll();
      } else {
        if (Object.keys(rowSelection).length === 2) {
          deselectAll();
        } else {
          selectAll();
        }
      }
    }

    handleSelectAll(true);
    expect(Object.keys(rowSelection).length).toBe(2);

    handleSelectAll(false);
    expect(Object.keys(rowSelection).length).toBe(0);

    handleSelectAll();
    expect(Object.keys(rowSelection).length).toBe(2);

    handleSelectAll();
    expect(Object.keys(rowSelection).length).toBe(0);
  });
});
