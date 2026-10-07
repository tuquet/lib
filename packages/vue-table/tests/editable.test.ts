import { describe, expect, it, vi } from 'vitest';
import { createEditableColumn } from '../src/helpers/formatters.js';

interface TestUser {
  id: string;
  name: string;
  age: number;
  status: 'active' | 'inactive';
}

describe('createEditableColumn', () => {
  it('creates an editable column definition with defaults', () => {
    const col = createEditableColumn<TestUser>({
      accessorKey: 'name',
      header: 'Họ và tên',
    });

    expect(col.id).toBe('name');
    expect((col as any).accessorKey).toBe('name');
    expect(col.header).toBe('Họ và tên');
    expect(col.enableSorting).toBe(true);
  });

  it('renders cell with EditableCell and handles onSave callback', () => {
    const onSave = vi.fn();
    const col = createEditableColumn<TestUser>({
      accessorKey: 'name',
      header: 'Họ và tên',
      onSave,
    });

    const mockRow = {
      original: { id: '1', name: 'John Doe', age: 30, status: 'active' as const },
      getValue: vi.fn((key: string) => (key === 'name' ? 'John Doe' : undefined)),
    };

    if (typeof col.cell === 'function') {
      const vnode = col.cell({ row: mockRow as any } as any);
      expect(vnode).toBeDefined();
      expect(vnode.props?.modelValue).toBe('John Doe');

      // Trigger update:modelValue
      vnode.props?.['onUpdate:modelValue']('Jane Doe');
      expect(mockRow.original.name).toBe('Jane Doe');
      expect(onSave).toHaveBeenCalledWith('Jane Doe', mockRow.original);
    }
  });

  it('supports select mode with options and custom size', () => {
    const col = createEditableColumn<TestUser, TestUser['status']>({
      accessorKey: 'status',
      header: 'Trạng thái',
      type: 'select',
      size: 150,
      options: [
        { label: 'Active', value: 'active', variant: 'default' },
        { label: 'Inactive', value: 'inactive', variant: 'secondary' },
      ],
    });

    expect(col.size).toBe(150);
    const mockRow = {
      original: { id: '2', name: 'Alice', age: 25, status: 'active' as const },
      getValue: vi.fn(() => 'active'),
    };

    if (typeof col.cell === 'function') {
      const vnode = col.cell({ row: mockRow as any } as any);
      expect(vnode.props?.type).toBe('select');
      expect(vnode.props?.options).toHaveLength(2);
    }
  });

  it('supports validation callback and number type restrictions', () => {
    const validate = vi.fn((val: number) => (val < 0 ? 'Tuổi không hợp lệ' : null));
    const col = createEditableColumn<TestUser, number>({
      accessorKey: 'age',
      header: 'Tuổi',
      type: 'number',
      min: 0,
      max: 120,
      validate,
    });

    const mockRow = {
      original: { id: '3', name: 'Bob', age: 40, status: 'active' as const },
      getValue: vi.fn(() => 40),
    };

    if (typeof col.cell === 'function') {
      const vnode = col.cell({ row: mockRow as any } as any);
      expect(vnode.props?.type).toBe('number');
      expect(vnode.props?.min).toBe(0);
      expect(vnode.props?.max).toBe(120);
      expect(vnode.props?.validate).toBe(validate);
    }
  });
});
