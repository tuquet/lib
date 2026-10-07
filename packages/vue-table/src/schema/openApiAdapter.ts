import type { ColumnDef } from '@tanstack/vue-table';
import {
  normalizeOpenAPISchema,
  type FieldOverridesMap,
  type NormalizedFieldDefinition,
  type OpenAPISchema,
  type UIWidgetType,
} from '@tuquet/vue-ui';
import { h } from 'vue';
import EditableCell from '../components/EditableCell.vue';
import { createCopyableColumn, createDateColumn } from '../helpers/index.js';

export interface ColumnBuildContext<TData = any> {
  size: number;
  onCellSave?: (key: string, newValue: any, row: TData) => void;
  validationMessage?: (field: NormalizedFieldDefinition) => string;
}

export type CustomColumnGenerator<TData = any> = (
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
) => ColumnDef<TData, any>;

export interface OpenApiTableOptions<TData = any> {
  overrides?: FieldOverridesMap & Record<string, any>;
  exclude?: string[];
  includeOnly?: string[];
  prependColumns?: ColumnDef<TData, any>[];
  appendColumns?: ColumnDef<TData, any>[];
  onCellSave?: (key: string, newValue: any, row: TData) => void;
  /**
   * Customizable column sizing map or resolver function (Open-Closed Principle)
   */
  columnSizes?: Record<string, number> | ((field: NormalizedFieldDefinition) => number | undefined);
  /**
   * Custom column generators per widget type (Dependency Inversion & Open-Closed Principle)
   */
  customGenerators?: Partial<Record<UIWidgetType | string, CustomColumnGenerator<TData>>>;
  /**
   * Customizable validation message resolver for required fields
   */
  validationMessage?: (field: NormalizedFieldDefinition) => string;
}

/**
 * Resolves column width in a domain-agnostic manner (SRP & OCP)
 */
export function resolveColumnSize(
  field: NormalizedFieldDefinition,
  columnSizes?: Record<string, number> | ((field: NormalizedFieldDefinition) => number | undefined)
): number {
  if (typeof columnSizes === 'function') {
    const custom = columnSizes(field);
    if (custom !== undefined) return custom;
  } else if (columnSizes && columnSizes[field.key] !== undefined) {
    return columnSizes[field.key];
  }

  // Schema-level overrides via extensions
  if (field.rawSchema['x-ui-width']) {
    return Number(field.rawSchema['x-ui-width']) || 150;
  }
  if (field.rawSchema['x-ui-col-span']) {
    return field.rawSchema['x-ui-col-span'] * 20;
  }

  // Standard widget-based ergonomic defaults
  if (field.copyable) return 140;

  switch (field.widget) {
    case 'pill-badges':
    case 'select':
      return 130;
    case 'slider':
      return 140;
    case 'currency':
      return 130;
    case 'number':
      return 120;
    case 'date':
      return 150;
    default:
      return 160;
  }
}

function buildSelectColumnDef<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
): ColumnDef<TData, any> {
  return {
    id: field.key,
    accessorKey: field.key,
    header: field.label,
    size: context.size,
    cell: ({ row }) => {
      return h(EditableCell, {
        modelValue: row.getValue(field.key) as any,
        type: 'select',
        disabled: field.disabled || field.readOnly,
        options: (field.enumOptions as any) || [],
        'onUpdate:modelValue': (newVal: any) => {
          (row.original as any)[field.key] = newVal;
          if (context.onCellSave) {
            context.onCellSave(field.key, newVal, row.original);
          }
        },
      });
    },
  };
}

function buildSliderColumnDef<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
): ColumnDef<TData, any> {
  return {
    id: field.key,
    accessorKey: field.key,
    header: field.label,
    size: context.size,
    cell: ({ row }) => {
      const val = row.getValue(field.key) as number;
      return h(
        EditableCell,
        {
          modelValue: val,
          type: 'number',
          min: field.min ?? 0,
          max: field.max ?? 100,
          step: field.step ?? 5,
          suffix: field.suffix || '%',
          disabled: field.disabled || field.readOnly,
          'onUpdate:modelValue': (newVal: any) => {
            (row.original as any)[field.key] = newVal;
            if (context.onCellSave) {
              context.onCellSave(field.key, newVal, row.original);
            }
          },
        },
        {
          display: ({ value }: { value: number }) => {
            const pct = Number(value) || 0;
            const barColor =
              pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500';
            return h('div', { class: 'flex items-center gap-2 flex-1 min-w-0' }, [
              h(
                'div',
                {
                  class:
                    'w-14 h-2 rounded-full bg-muted/60 overflow-hidden border border-border/40 shrink-0',
                },
                [
                  h('div', {
                    class: `h-full ${barColor} transition-all`,
                    style: { width: `${pct}%` },
                  }),
                ]
              ),
              h('span', { class: 'text-xs font-mono text-muted-foreground w-8' }, `${pct}%`),
            ]);
          },
        }
      );
    },
  };
}

function buildCurrencyColumnDef<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
): ColumnDef<TData, any> {
  const prefix = field.prefix || '$';
  return {
    id: field.key,
    accessorKey: field.key,
    header: field.label,
    size: context.size,
    cell: ({ row }) => {
      const val = row.getValue(field.key) as number;
      return h(
        EditableCell,
        {
          modelValue: val,
          type: 'number',
          min: field.min,
          step: field.step || 10,
          prefix,
          disabled: field.disabled || field.readOnly,
          'onUpdate:modelValue': (newVal: any) => {
            (row.original as any)[field.key] = newVal;
            if (context.onCellSave) {
              context.onCellSave(field.key, newVal, row.original);
            }
          },
        },
        {
          display: ({ value }: { value: number }) =>
            h(
              'span',
              { class: 'font-mono text-xs font-semibold text-foreground' },
              `${prefix}${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ),
        }
      );
    },
  };
}

function buildDateColumnDef<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
): ColumnDef<TData, any> {
  return createDateColumn<TData>({
    accessorKey: field.key as any,
    header: field.label,
    relative: true,
    size: context.size,
  } as any);
}

function buildNumberColumnDef<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
): ColumnDef<TData, any> {
  return {
    id: field.key,
    accessorKey: field.key,
    header: field.label,
    size: context.size,
    cell: ({ row }) => {
      const val = row.getValue(field.key);
      return h(EditableCell, {
        modelValue: val as any,
        type: 'number',
        min: field.min,
        max: field.max,
        step: field.step ?? 1,
        placeholder: field.placeholder,
        disabled: field.disabled || field.readOnly,
        validate: (v: any) => {
          if (field.required && (v === undefined || v === null || v === '')) {
            return context.validationMessage
              ? context.validationMessage(field)
              : `${field.label} is required`;
          }
          return null;
        },
        'onUpdate:modelValue': (newVal: any) => {
          (row.original as any)[field.key] = newVal;
          if (context.onCellSave) {
            context.onCellSave(field.key, newVal, row.original);
          }
        },
      });
    },
  };
}

function buildTextColumnDef<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>
): ColumnDef<TData, any> {
  return {
    id: field.key,
    accessorKey: field.key,
    header: field.label,
    size: context.size,
    cell: ({ row }) => {
      const val = row.getValue(field.key);
      return h(EditableCell, {
        modelValue: val as any,
        type: 'text',
        placeholder: field.placeholder,
        disabled: field.disabled || field.readOnly,
        validate: (v: any) => {
          if (field.required && (!v || !String(v).trim())) {
            return context.validationMessage
              ? context.validationMessage(field)
              : `${field.label} is required`;
          }
          return null;
        },
        'onUpdate:modelValue': (newVal: any) => {
          (row.original as any)[field.key] = newVal;
          if (context.onCellSave) {
            context.onCellSave(field.key, newVal, row.original);
          }
        },
      });
    },
  };
}

function createColumnForField<TData>(
  field: NormalizedFieldDefinition,
  context: ColumnBuildContext<TData>,
  customGenerators?: Partial<Record<string, CustomColumnGenerator<TData>>>
): ColumnDef<TData, any> {
  // Check for custom generator first (Open-Closed / Dependency Inversion)
  if (customGenerators && customGenerators[field.widget]) {
    return customGenerators[field.widget]!(field, context);
  }

  // 1. Copyable Column
  if (field.copyable) {
    return createCopyableColumn<TData>({
      accessorKey: field.key as any,
      header: field.label,
      size: context.size,
    } as any);
  }

  // 2. Select / Badge Column
  if (field.widget === 'pill-badges' || field.widget === 'select') {
    return buildSelectColumnDef(field, context);
  }

  // 3. Slider / Progress Column
  if (field.widget === 'slider') {
    return buildSliderColumnDef(field, context);
  }

  // 4. Currency Column
  if (field.widget === 'currency') {
    return buildCurrencyColumnDef(field, context);
  }

  // 5. Date Column
  if (field.widget === 'date' || field.format === 'date-time' || field.format === 'date') {
    return buildDateColumnDef(field, context);
  }

  // 6. Number Column
  if (field.widget === 'number' || field.type === 'integer' || field.type === 'number') {
    return buildNumberColumnDef(field, context);
  }

  // 7. Generic Text Column with Inline Edit
  return buildTextColumnDef(field, context);
}

/**
 * Generate ColumnDef[] array for TanStack Table directly from OpenAPI 3.0+ Schema
 */
export function openApiToColumns<TData = any>(
  schema: OpenAPISchema,
  options?: OpenApiTableOptions<TData>
): ColumnDef<TData, any>[] {
  const {
    overrides = {},
    exclude = [],
    includeOnly,
    prependColumns = [],
    appendColumns = [],
    onCellSave,
    columnSizes,
    customGenerators,
    validationMessage,
  } = options || {};

  const normalizedFields = normalizeOpenAPISchema(schema, {
    overrides,
    exclude,
    includeOnly,
  });

  const columns: ColumnDef<TData, any>[] = [...prependColumns];

  for (const field of normalizedFields) {
    if (field.hidden) continue;

    const size = resolveColumnSize(field, columnSizes);
    const context: ColumnBuildContext<TData> = {
      size,
      onCellSave,
      validationMessage,
    };

    const colDef = createColumnForField(field, context, customGenerators);

    // Apply any direct column overrides from options
    if (overrides[field.key]) {
      Object.assign(colDef, overrides[field.key]);
    }

    columns.push(colDef);
  }

  columns.push(...appendColumns);

  return columns;
}
