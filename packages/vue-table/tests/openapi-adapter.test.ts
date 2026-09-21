import { describe, expect, it, vi } from 'vitest';
import type { OpenAPISchema } from '@tuquet/vue-ui';
import { openApiToColumns } from '../src/schema/openApiAdapter.js';
import { createSelectionColumn } from '../src/helpers/selection.js';

interface TestOrder {
  id: string;
  orderNumber: string;
  customer: string;
  status: 'completed' | 'pending';
  total: number;
}

const mockOrderSchema: OpenAPISchema = {
  type: 'object',
  required: ['orderNumber', 'customer'],
  properties: {
    orderNumber: {
      type: 'string',
      title: 'Mã Đơn',
      'x-ui-copyable': true,
    },
    customer: {
      type: 'string',
      title: 'Khách Hàng',
    },
    status: {
      type: 'string',
      title: 'Trạng Thái',
      enum: ['completed', 'pending'],
    },
    total: {
      type: 'number',
      title: 'Tổng Tiền',
      format: 'currency',
      'x-ui-prefix': '$',
    },
  },
};

describe('OpenAPI 3.0+ to TanStack Table Adapter', () => {
  it('translates OpenAPI schema properties to ColumnDef[]', () => {
    const columns = openApiToColumns<TestOrder>(mockOrderSchema);

    expect(columns).toHaveLength(4);
    expect(columns[0].header).toBe('Mã Đơn');
    expect(columns[1].header).toBe('Khách Hàng');
    expect(columns[2].header).toBe('Trạng Thái');
    expect(columns[3].header).toBe('Tổng Tiền');
  });

  it('prepends selection column and appends custom columns', () => {
    const selectionCol = createSelectionColumn<TestOrder>();
    const customActionCol = { id: 'actions', header: 'Hành động' };

    const columns = openApiToColumns<TestOrder>(mockOrderSchema, {
      prependColumns: [selectionCol],
      appendColumns: [customActionCol],
    });

    expect(columns).toHaveLength(6);
    expect(columns[0].id).toBe('select');
    expect(columns[columns.length - 1].id).toBe('actions');
  });

  it('supports fine-grained overrides and onCellSave callback', () => {
    const onCellSave = vi.fn();
    const columns = openApiToColumns<TestOrder>(mockOrderSchema, {
      overrides: {
        customer: {
          header: 'Tên Khách Hàng VIP',
          size: 250,
        },
      },
      onCellSave,
    });

    const customerCol = columns.find((c: any) => c.accessorKey === 'customer')!;
    expect(customerCol.header).toBe('Tên Khách Hàng VIP');
    expect(customerCol.size).toBe(250);

    const mockRow = {
      original: { id: '1', customer: 'Nguyen Van A' },
      getValue: vi.fn(() => 'Nguyen Van A'),
    };

    if (typeof customerCol.cell === 'function') {
      const vnode = (customerCol.cell as any)({ row: mockRow });
      expect(vnode.props?.modelValue).toBe('Nguyen Van A');

      // Trigger cell update
      vnode.props?.['onUpdate:modelValue']('Nguyen Van B');
      expect((mockRow.original as any).customer).toBe('Nguyen Van B');
      expect(onCellSave).toHaveBeenCalledWith('customer', 'Nguyen Van B', mockRow.original);
    }
  });

  it('supports configurable columnSizes map and resolver function (OCP)', () => {
    // 1. Using columnSizes map
    const colsWithMap = openApiToColumns<TestOrder>(mockOrderSchema, {
      columnSizes: {
        orderNumber: 180,
        customer: 320,
      },
    });
    expect(colsWithMap.find((c: any) => c.accessorKey === 'orderNumber')?.size).toBe(180);
    expect(colsWithMap.find((c: any) => c.accessorKey === 'customer')?.size).toBe(320);

    // 2. Using columnSizes resolver function
    const colsWithFn = openApiToColumns<TestOrder>(mockOrderSchema, {
      columnSizes: (field) => (field.key === 'customer' ? 400 : undefined),
    });
    expect(colsWithFn.find((c: any) => c.accessorKey === 'customer')?.size).toBe(400);
    expect(colsWithFn.find((c: any) => c.accessorKey === 'orderNumber')?.size).toBe(140); // default copyable
  });

  it('supports customGenerators for widget extensibility (OCP & DIP)', () => {
    const customGenerator = vi.fn((field, context) => ({
      id: field.key,
      accessorKey: field.key,
      header: `Custom: ${field.label}`,
      size: context.size,
    }));

    const columns = openApiToColumns<TestOrder>(mockOrderSchema, {
      customGenerators: {
        currency: customGenerator,
      },
    });

    const totalCol = columns.find((c: any) => c.accessorKey === 'total');
    expect(customGenerator).toHaveBeenCalled();
    expect(totalCol?.header).toBe('Custom: Tổng Tiền');
  });

  it('supports configurable validationMessage resolver (YAGNI & i18n)', () => {
    const columns = openApiToColumns<TestOrder>(mockOrderSchema, {
      validationMessage: (field) => `Trường ${field.label} bắt buộc phải nhập`,
    });

    const customerCol = columns.find((c: any) => c.accessorKey === 'customer')!;
    const mockRow = {
      original: { id: '1', customer: '' },
      getValue: vi.fn(() => ''),
    };

    if (typeof customerCol.cell === 'function') {
      const vnode = (customerCol.cell as any)({ row: mockRow });
      const validateFn = vnode.props?.validate;
      expect(validateFn).toBeDefined();
      expect(validateFn('')).toBe('Trường Khách Hàng bắt buộc phải nhập');
    }
  });
});
