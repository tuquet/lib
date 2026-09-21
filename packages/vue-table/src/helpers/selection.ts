import type { ColumnDef, Row, Table } from '@tanstack/vue-table';
import { Checkbox } from '@tuquet/vue-ui';
import { h } from 'vue';

export interface SelectionColumnOptions<TData> {
  id?: string;
  isRowSelectable?: (row: Row<TData>) => boolean;
  headerAriaLabel?: string;
  rowAriaLabel?: (row: Row<TData>) => string;
  size?: number;
}

export function createSelectionColumn<TData>(
  options: SelectionColumnOptions<TData> = {}
): ColumnDef<TData, unknown> {
  const {
    id = 'select',
    isRowSelectable,
    headerAriaLabel = 'Select all rows',
    rowAriaLabel = (row) => `Select row ${row.index + 1}`,
    size = 40,
  } = options;

  return {
    id,
    header: ({ table }: { table: Table<TData> }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();
      const checkedVal = isAllSelected ? true : isSomeSelected ? 'indeterminate' : false;

      const handleToggle = (val: boolean | 'indeterminate') => {
        table.toggleAllPageRowsSelected(!!val);
      };

      return h(Checkbox, {
        checked: checkedVal,
        modelValue: checkedVal,
        'onUpdate:checked': handleToggle,
        'onUpdate:modelValue': handleToggle,
        'aria-label': headerAriaLabel,
        class: 'translate-y-[2px] mx-auto block',
      });
    },
    cell: ({ row }: { row: Row<TData> }) => {
      const selectable = isRowSelectable ? isRowSelectable(row) : true;
      const isChecked = row.getIsSelected();

      const handleRowToggle = (val: boolean | 'indeterminate') => {
        row.toggleSelected(!!val);
      };

      return h(Checkbox, {
        checked: isChecked,
        modelValue: isChecked,
        disabled: !selectable,
        'onUpdate:checked': handleRowToggle,
        'onUpdate:modelValue': handleRowToggle,
        'aria-label': rowAriaLabel(row),
        class: 'translate-y-[2px] mx-auto block',
        onClick: (e: MouseEvent) => e.stopPropagation(),
      });
    },
    enableSorting: false,
    enableHiding: false,
    size,
  };
}
