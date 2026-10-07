import type { Row } from '@tanstack/vue-table';
import { describe, expect, it } from 'vitest';
import {
  createActionsColumn,
  createAvatarColumn,
  createBadgeColumn,
  createCopyableColumn,
  createCurrencyColumn,
  createDateColumn,
} from '../src/helpers/formatters.js';

describe('Column Formatters', () => {
  describe('createDateColumn', () => {
    it('formats date correctly', () => {
      const col = createDateColumn<{ createdAt: string }>({
        accessorKey: 'createdAt',
        header: 'Created At',
        locale: 'en-US',
      });

      expect(col.id).toBe('createdAt');
      expect(col.header).toBe('Created At');

      if (typeof col.cell === 'function') {
        const result = col.cell({
          getValue: () => '2026-01-15T12:00:00Z',
        } as any);
        expect(typeof result).toBe('string');
        expect(result).toContain('2026');
      }
    });

    it('returns nullValue for falsy dates', () => {
      const col = createDateColumn<{ createdAt: string }>({
        accessorKey: 'createdAt',
        header: 'Created At',
        nullValue: 'N/A',
      });

      if (typeof col.cell === 'function') {
        const result = col.cell({ getValue: () => null } as any);
        expect(result).toBe('N/A');
      }
    });

    it('supports relative date calculation', () => {
      const col = createDateColumn<{ createdAt: string }>({
        accessorKey: 'createdAt',
        header: 'Created At',
        relative: true,
      });

      if (typeof col.cell === 'function') {
        const result = col.cell({
          getValue: () => new Date().toISOString(),
        } as any) as any;
        expect(result).toBeDefined();
        // Since it's a VNode
        expect(result.children).toBe('just now');
      }
    });
  });

  describe('createBadgeColumn', () => {
    it('renders badge with matched variant and label', () => {
      const col = createBadgeColumn<{ status: string }>({
        accessorKey: 'status',
        header: 'Status',
        variants: {
          active: 'default',
          suspended: 'destructive',
        },
        labels: {
          active: 'Active Account',
        },
      });

      if (typeof col.cell === 'function') {
        const vnode = col.cell({ getValue: () => 'active' } as any) as any;
        expect(vnode).toBeDefined();
        expect(vnode.props.variant).toBe('default');
        expect(vnode.children.default()).toBe('Active Account');
      }
    });

    it('falls back to defaultVariant and original value', () => {
      const col = createBadgeColumn<{ status: string }>({
        accessorKey: 'status',
        header: 'Status',
        variants: { active: 'default' },
        defaultVariant: 'outline',
      });

      if (typeof col.cell === 'function') {
        const vnode = col.cell({ getValue: () => 'unknown_state' } as any) as any;
        expect(vnode.props.variant).toBe('outline');
        expect(vnode.children.default()).toBe('unknown_state');
      }
    });
  });

  describe('createCurrencyColumn', () => {
    it('formats number to USD currency by default', () => {
      const col = createCurrencyColumn<{ amount: number }>({
        accessorKey: 'amount',
        header: 'Price',
        currency: 'USD',
        locale: 'en-US',
      });

      if (typeof col.cell === 'function') {
        const result = col.cell({ getValue: () => 1500 } as any);
        expect(result).toBe('$1,500.00');
      }
    });

    it('returns nullValue for empty numbers', () => {
      const col = createCurrencyColumn<{ amount: number }>({
        accessorKey: 'amount',
        header: 'Price',
        nullValue: 'Free',
      });

      if (typeof col.cell === 'function') {
        const result = col.cell({ getValue: () => null } as any);
        expect(result).toBe('Free');
      }
    });
  });

  describe('createCopyableColumn', () => {
    it('creates copyable column with CopyableCell component', () => {
      const col = createCopyableColumn<{ apiKey: string }>({
        accessorKey: 'apiKey',
        header: 'API Key',
        truncateLength: 10,
      });

      if (typeof col.cell === 'function') {
        const vnode = col.cell({ getValue: () => 'sk_test_1234567890abcdef' } as any) as any;
        expect(vnode).toBeDefined();
        expect(vnode.props.value).toBe('sk_test_1234567890abcdef');
        expect(vnode.props.truncateLength).toBe(10);
      }
    });
  });

  describe('createAvatarColumn', () => {
    interface UserRow {
      name: string;
      email?: string;
      avatarUrl?: string;
    }

    it('creates avatar column with proper id, header, and sorting', () => {
      const col = createAvatarColumn<UserRow>({
        nameKey: 'name',
        descriptionKey: 'email',
        srcKey: 'avatarUrl',
        header: 'User',
      });

      expect(col.id).toBe('name');
      expect(col.header).toBe('User');
      expect(col.enableSorting).toBe(true);

      if (typeof col.cell === 'function') {
        const row = {
          original: {
            name: 'John Doe',
            email: 'john@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
        } as unknown as Row<UserRow>;

        const vnode = col.cell({ row } as any) as any;
        expect(vnode).toBeDefined();
        expect(vnode.children).toHaveLength(2); // avatar + text column
      }
    });

    it('handles single-word names and empty description', () => {
      const col = createAvatarColumn<UserRow>({
        nameKey: 'name',
        header: 'Name',
      });

      if (typeof col.cell === 'function') {
        const row = {
          original: {
            name: 'Alice',
          },
        } as unknown as Row<UserRow>;

        const vnode = col.cell({ row } as any) as any;
        expect(vnode).toBeDefined();
      }
    });
  });

  describe('createActionsColumn', () => {
    it('creates actions column with default size and unhideable', () => {
      const col = createActionsColumn({
        actions: [{ id: 'edit', label: 'Edit' }],
      });

      expect(col.id).toBe('actions');
      expect(col.enableSorting).toBe(false);
      expect(col.enableHiding).toBe(false);
      expect(col.size).toBe(50);
    });
  });
});
