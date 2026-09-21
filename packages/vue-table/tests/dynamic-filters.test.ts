import { describe, expect, it } from 'vitest';
import { useDynamicFilters } from '../src/composables/useDynamicFilters.js';
import type { ColumnFilterDefinition, FilterPreset } from '../src/types/filter.js';

const COLUMN_DEFS: ColumnFilterDefinition[] = [
  { id: 'customer', label: 'Khách hàng', dataType: 'text' },
  { id: 'total', label: 'Tổng tiền', dataType: 'number' },
  {
    id: 'status',
    label: 'Trạng thái',
    dataType: 'select',
    options: [
      { label: 'Hoàn thành', value: 'completed' },
      { label: 'Chờ xử lý', value: 'pending' },
      { label: 'Đã hủy', value: 'cancelled' },
    ],
  },
  { id: 'createdAt', label: 'Ngày tạo', dataType: 'date' },
  { id: 'isActive', label: 'Kích hoạt', dataType: 'boolean' },
];

const PRESETS: FilterPreset[] = [
  {
    id: 'preset_high_value',
    name: 'Đơn hàng giá trị cao',
    conjunction: 'and',
    rules: [{ id: 'p1', field: 'total', operator: 'gte', value: 1000000 }],
  },
];

describe('useDynamicFilters Composable', () => {
  it('initializes with empty rules and default conjunction', () => {
    const filters = useDynamicFilters({ columnDefs: COLUMN_DEFS });
    expect(filters.rules.value).toHaveLength(0);
    expect(filters.conjunction.value).toBe('and');
    expect(filters.activeRuleCount.value).toBe(0);
  });

  it('adds rules with appropriate default operator based on data type', () => {
    const filters = useDynamicFilters({ columnDefs: COLUMN_DEFS });

    // Text field defaults to 'contains'
    const r1 = filters.addRule('customer', undefined, 'Vingroup');
    expect(r1.operator).toBe('contains');
    expect(filters.rules.value).toHaveLength(1);
    expect(filters.activeRuleCount.value).toBe(1);

    // Number field defaults to 'gte'
    const r2 = filters.addRule('total', undefined, 500000);
    expect(r2.operator).toBe('gte');
    expect(filters.rules.value).toHaveLength(2);
    expect(filters.activeRuleCount.value).toBe(2);

    // Boolean field defaults to 'isTrue' (does not require value)
    filters.addRule('isActive');
    expect(filters.activeRuleCount.value).toBe(3);
  });

  it('updates rule field and re-aligns default operator', () => {
    const filters = useDynamicFilters({ columnDefs: COLUMN_DEFS });
    const rule = filters.addRule('customer', 'contains', 'Vin');

    filters.updateRule(rule.id, { field: 'total' });
    const updated = filters.rules.value.find((r) => r.id === rule.id);

    expect(updated?.field).toBe('total');
    expect(updated?.operator).toBe('gte'); // Adapted to number
    expect(updated?.value).toBeUndefined(); // Reset value
  });

  it('removes rule and clears rules correctly', () => {
    const filters = useDynamicFilters({ columnDefs: COLUMN_DEFS });
    const r1 = filters.addRule('customer', 'contains', 'Test');
    const r2 = filters.addRule('total', 'gt', 100);

    expect(filters.rules.value).toHaveLength(2);
    filters.removeRule(r1.id);
    expect(filters.rules.value).toHaveLength(1);
    expect(filters.rules.value[0].id).toBe(r2.id);

    filters.clearRules();
    expect(filters.rules.value).toHaveLength(0);
    expect(filters.activeRuleCount.value).toBe(0);
  });

  it('applies saved preset views', () => {
    const filters = useDynamicFilters({ columnDefs: COLUMN_DEFS, presets: PRESETS });
    filters.applyPreset(PRESETS[0]);

    expect(filters.rules.value).toHaveLength(1);
    expect(filters.rules.value[0].field).toBe('total');
    expect(filters.rules.value[0].operator).toBe('gte');
    expect(filters.rules.value[0].value).toBe(1000000);
  });

  it('generates serializable query params for REST APIs', () => {
    const filters = useDynamicFilters({ columnDefs: COLUMN_DEFS });
    filters.addRule('status', 'is', 'completed');
    filters.addRule('customer', 'contains', 'Vinamilk');

    const params = filters.serializedParams.value;
    expect(params).toHaveProperty('filters');
    expect(params.status).toBe('completed');
    expect(typeof params.filters).toBe('string');

    const parsed = JSON.parse(params.filters as string);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].field).toBe('status');
  });

  it('supports customEvaluator in filterDataset (OCP)', () => {
    const mockItems = [
      { id: '1', customer: 'ABC Corp' },
      { id: '2', customer: 'XYZ Ltd' },
    ];

    const customEvaluator = (_item: Record<string, unknown>, rule: any) => {
      if (rule.field === 'customer' && rule.value === 'ALL') {
        return true;
      }
      return undefined;
    };

    const filters = useDynamicFilters({
      columnDefs: COLUMN_DEFS,
      customEvaluator,
    });

    filters.addRule('customer', 'contains', 'ALL');
    const result = filters.filterDataset(mockItems);
    expect(result).toHaveLength(2);
  });
});

describe('useRemoteTable Dynamic Filters Integration', () => {
  interface Order {
    id: string;
    customer: string;
    total: number;
    status: string;
  }

  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'total', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
  ];

  it('passes dynamicRules and conjunction in FetchParams to fetcher', async () => {
    const { useRemoteTable } = await import('../src/composables/useRemoteTable.js');
    let capturedParams: any = null;

    const table = useRemoteTable<Order>({
      columns,
      syncWithUrl: false,
      fetcher: async (params) => {
        capturedParams = params;
        return { data: [], total: 0 };
      },
      dynamicRules: [{ id: 'r1', field: 'customer', operator: 'contains', value: 'Vingroup' }],
      conjunction: 'or',
    });

    // Wait for initial fetch
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(capturedParams).not.toBeNull();
    expect(capturedParams.dynamicRules).toHaveLength(1);
    expect(capturedParams.dynamicRules[0].field).toBe('customer');
    expect(capturedParams.conjunction).toBe('or');

    // Standard REST Adapter serialized filters
    expect(capturedParams.queryParams).toHaveProperty('filters');
    expect(capturedParams.queryParams.conjunction).toBe('or');

    // Test setters
    table.setDynamicConjunction('and');
    expect(table.conjunction.value).toBe('and');

    table.setDynamicRules([{ id: 'r2', field: 'total', operator: 'gt', value: 1000 }]);
    expect(table.dynamicRules.value).toHaveLength(1);
    expect(table.activeFilterCount.value).toBe(1);

    // Filter API facade
    table.api.filter.addRule({ field: 'status', operator: 'eq', value: 'completed' });
    expect(table.dynamicRules.value).toHaveLength(2);
    expect(table.api.filter.getRules()).toHaveLength(2);

    table.clearDynamicRules();
    expect(table.dynamicRules.value).toHaveLength(0);
    expect(table.activeFilterCount.value).toBe(0);
  });
});
