import type { ColumnDef, Row } from '@tanstack/vue-table';
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@tuquet/vue-ui';
import { type Component, h } from 'vue';
import CopyableCell from '../components/CopyableCell.vue';
import DataTableRowActions, {
  type DataTableRowActionsProps,
  type RowActionItem,
} from '../components/DataTableRowActions.vue';
import EditableCell, { type SelectOption } from '../components/EditableCell.vue';

// --- Date Column ---
export interface DateColumnOptions<TData> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  size?: number;
  locale?: string;
  relative?: boolean;
  dateFormatOptions?: Intl.DateTimeFormatOptions;
  nullValue?: string;
  enableSorting?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffSec = Math.round((now - date.getTime()) / 1000);

  if (diffSec < 45) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function createDateColumn<TData>(options: DateColumnOptions<TData>): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    size,
    locale = 'en-US',
    relative = false,
    dateFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    nullValue = '-',
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey,
    header,
    size,

    cell: ({ getValue }) => {
      const raw = getValue();
      if (!raw) return nullValue;

      const date = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(date.getTime())) return String(raw);

      if (relative) {
        return h(
          'span',
          { title: date.toLocaleString(locale, dateFormatOptions) },
          formatRelativeTime(date)
        );
      }

      return date.toLocaleString(locale, dateFormatOptions);
    },
    enableSorting,
  };
}

// --- Badge Column ---
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeColumnOptions<TData, TValue extends string = string> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  variants: Partial<Record<TValue, BadgeVariant>>;
  labels?: Partial<Record<TValue, string>>;
  defaultVariant?: BadgeVariant;
  nullValue?: string;
  enableSorting?: boolean;
}

export function createBadgeColumn<TData, TValue extends string = string>(
  options: BadgeColumnOptions<TData, TValue>
): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    variants,
    labels = {} as Partial<Record<TValue, string>>,
    defaultVariant = 'outline',
    nullValue = '-',
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const val = getValue() as TValue;
      if (val === undefined || val === null) return nullValue;

      const variant = variants[val] ?? defaultVariant;
      const label = labels[val] ?? String(val);

      return h(
        Badge,
        {
          variant,
          class: 'capitalize font-normal',
        },
        () => label
      );
    },
    enableSorting,
  };
}

// --- Currency Column ---
export interface CurrencyColumnOptions<TData> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  currency?: string;
  locale?: string;
  nullValue?: string;
  enableSorting?: boolean;
}

export function createCurrencyColumn<TData>(
  options: CurrencyColumnOptions<TData>
): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    currency = 'USD',
    locale = 'en-US',
    nullValue = '-',
    enableSorting = true,
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });

  return {
    id,
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const val = getValue();
      if (val === undefined || val === null) return nullValue;

      const num = typeof val === 'number' ? val : Number(val);
      if (Number.isNaN(num)) return String(val);

      return formatter.format(num);
    },
    enableSorting,
  };
}

// --- Copyable Column ---
export interface CopyableColumnOptions<TData> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  size?: number;
  truncateLength?: number;
  enableSorting?: boolean;
}

export function createCopyableColumn<TData>(
  options: CopyableColumnOptions<TData>
): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    size,
    truncateLength,
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey,
    header,
    size,
    cell: ({ getValue }) => {
      const val = getValue();
      if (val === undefined || val === null) return '-';

      return h(CopyableCell, {
        value: String(val),
        truncateLength,
      });
    },
    enableSorting,
  };
}

// --- Avatar Column ---
export interface AvatarColumnOptions<TData> {
  header: string;
  id?: string;
  nameKey: keyof TData & string;
  srcKey?: keyof TData & string;
  descriptionKey?: keyof TData & string;
  size?: 'sm' | 'base' | 'lg';
  enableSorting?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

export function createAvatarColumn<TData>(
  options: AvatarColumnOptions<TData>
): ColumnDef<TData, unknown> {
  const {
    nameKey,
    srcKey,
    descriptionKey,
    header,
    id = nameKey,
    size = 'sm',
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey: nameKey,
    header,
    cell: ({ row }: { row: Row<TData> }) => {
      const original = row?.original;
      const name = String(original?.[nameKey] ?? '');
      const src = srcKey && original ? String(original[srcKey] ?? '') : '';
      const description = descriptionKey && original ? String(original[descriptionKey] ?? '') : '';
      const initials = getInitials(name);

      const avatarClasses =
        size === 'sm'
          ? 'h-8 w-8 text-xs'
          : size === 'lg'
            ? 'h-12 w-12 text-base'
            : 'h-10 w-10 text-sm';

      const avatarChildren = [
        src ? h(AvatarImage, { src, alt: name }) : null,
        h(AvatarFallback, null, () => initials),
      ].filter(Boolean);

      const avatarVNode = h(Avatar, { class: avatarClasses }, () => avatarChildren);

      const textChildren = [
        h('span', { class: 'font-medium text-sm text-foreground leading-none' }, name),
        description
          ? h('span', { class: 'text-xs text-muted-foreground leading-none mt-1' }, description)
          : null,
      ].filter(Boolean);

      return h('div', { class: 'flex items-center gap-3' }, [
        avatarVNode,
        h('div', { class: 'flex flex-col' }, textChildren),
      ]);
    },
    enableSorting,
  };
}

// --- Actions Column ---
export interface ActionsColumnOptions<TData> {
  id?: string;
  header?: string;
  actions: RowActionItem<TData>[];
  size?: number;
}

export function createActionsColumn<TData>(
  options: ActionsColumnOptions<TData>
): ColumnDef<TData, unknown> {
  const { id = 'actions', header = '', actions, size = 50 } = options;

  return {
    id,
    header,
    cell: ({ row }: { row: Row<TData> }) => {
      return h(DataTableRowActions as Component<DataTableRowActionsProps<TData>>, {
        row,
        actions,
      });
    },
    enableSorting: false,
    enableHiding: false,
    size,
  };
}

// --- Editable Column ---
export interface EditableColumnOptions<TData, TValue = any> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  type?: 'text' | 'number' | 'select';
  options?: SelectOption<TValue>[];
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  disabled?: boolean | ((row: TData) => boolean);
  validate?: (val: TValue) => string | null;
  onSave?: (newValue: TValue, row: TData) => void | Promise<void>;
  displayRender?: (value: TValue, row: TData) => any;
  enableSorting?: boolean;
}

export function createEditableColumn<TData, TValue = any>(
  options: EditableColumnOptions<TData, TValue>
): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    type = 'text',
    options: selectOptions = [],
    placeholder,
    prefix,
    suffix,
    min,
    max,
    step,
    size,
    disabled = false,
    validate,
    onSave,
    displayRender,
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey,
    header,
    size,
    cell: ({ row }) => {
      const original = row?.original;
      const isDisabled =
        typeof disabled === 'function' ? (original ? disabled(original) : false) : disabled;
      const currentValue = row?.getValue
        ? (row.getValue(id) as TValue)
        : (original as any)?.[accessorKey];

      return h(
        EditableCell,
        {
          modelValue: currentValue as any,
          type,
          options: selectOptions as any,
          placeholder,
          prefix,
          suffix,
          min,
          max,
          step,
          disabled: isDisabled,
          validate: validate as any,
          'onUpdate:modelValue': (newVal: any) => {
            if (original) {
              (original as any)[accessorKey] = newVal;
              if (onSave) {
                onSave(newVal, original);
              }
            }
          },
        },
        displayRender
          ? {
              display: ({ value }: { value: any }) =>
                original ? displayRender(value, original) : String(value ?? ''),
            }
          : undefined
      );
    },
    enableSorting,
  };
}
