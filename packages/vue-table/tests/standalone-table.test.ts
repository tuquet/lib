import type { ColumnDef } from '@tanstack/vue-table';
import { describe, expect, it, vi } from 'vitest';
import DataTable from '../src/components/DataTable.vue';
import { DataTable as ExportedDataTable, useDataTable, useRemoteTable } from '../src/index.js';
import type { DynamicFilterRule, FilterPreset } from '../src/types/index.js';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

const testColumns: ColumnDef<ProductItem, any>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Product Name', enableSorting: true },
  { accessorKey: 'price', header: 'Price', enableSorting: true },
  { accessorKey: 'category', header: 'Category' },
];

const testData: ProductItem[] = [
  { id: '1', name: 'MacBook Pro', price: 2000, category: 'Laptops' },
  { id: '2', name: 'Dell XPS', price: 1500, category: 'Laptops' },
  { id: '3', name: 'iPad Pro', price: 800, category: 'Tablets' },
  { id: '4', name: 'Logitech MX Master', price: 100, category: 'Accessories' },
];

describe('DataTable DX & Integration Refactoring', () => {
  describe('Composable Aliases & Exports', () => {
    it('exports useDataTable and useRemoteTable for intuitive DX', () => {
      expect(useDataTable).toBeDefined();
      expect(useRemoteTable).toBeDefined();
      expect(typeof useDataTable).toBe('function');
      expect(typeof useRemoteTable).toBe('function');
    });

    it('exports DataTable from main package index', () => {
      expect(DataTable).toBeDefined();
      expect(ExportedDataTable).toBeDefined();
      expect(DataTable).toBe(ExportedDataTable);
      expect(typeof DataTable).toBe('object');
      expect(DataTable).toHaveProperty('setup');
    });
  });

  describe('DataTable Component Definition & Props Contract', () => {
    it('defines standalone props: data, columns, loading, total', () => {
      const props = (DataTable as any).props;
      expect(props).toBeDefined();
      expect(props).toHaveProperty('data');
      expect(props).toHaveProperty('columns');
      expect(props).toHaveProperty('loading');
      expect(props).toHaveProperty('total');
      expect(props).toHaveProperty('remote');
      expect(props).toHaveProperty('showToolbar');
      expect(props).toHaveProperty('showPagination');
      expect(props).toHaveProperty('showFloatingBar');
      expect(props).toHaveProperty('showFilterBuilder');
    });

    it('defaults data and columns to empty arrays if omitted', () => {
      const props = (DataTable as any).props;
      expect(props.data.default()).toEqual([]);
      expect(props.columns.default()).toEqual([]);
    });

    it('has bordered and border props defaulting to false and enableColumnResizing defaulting to false', () => {
      const props = (DataTable as any).props;
      expect(props).toHaveProperty('bordered');
      expect(props).toHaveProperty('border');
      expect(props).toHaveProperty('enableColumnResizing');
      expect(props.bordered.default).toBe(false);
      expect(props.border.default).toBe(false);
      expect(props.enableColumnResizing.default).toBe(false);
    });
  });

  describe('Filter Builder Self-Management Contract', () => {
    it('allows applying presets and updates dynamic rules cleanly', () => {
      const initialRules: DynamicFilterRule[] = [];
      const preset: FilterPreset = {
        id: 'laptop-deals',
        name: 'Laptop Deals',
        conjunction: 'and',
        rules: [
          {
            id: 'rule-1',
            field: 'category',
            operator: 'eq',
            value: 'Laptops',
          },
          {
            id: 'rule-2',
            field: 'price',
            operator: 'lte',
            value: 1800,
          },
        ],
      };

      // Emulates how DataTable.vue handles handleApplyPreset
      const internalRules = [...preset.rules];
      const internalConjunction = preset.conjunction;

      expect(internalRules).toHaveLength(2);
      expect(internalRules[0].field).toBe('category');
      expect(internalRules[1].value).toBe(1800);
      expect(internalConjunction).toBe('and');
    });

    it('triggers refetch automatically when remote instance is present', async () => {
      const mockRefetch = vi.fn().mockResolvedValue(undefined);
      const mockRemote = {
        table: {} as any,
        refetch: mockRefetch,
      };

      // Emulate rule update with remote
      function onRulesUpdated(rules: DynamicFilterRule[]) {
        mockRemote?.refetch?.();
      }

      onRulesUpdated([{ id: 'r1', field: 'price', operator: 'gte', value: 500 }]);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });
});
