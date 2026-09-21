<script setup lang="ts" generic="TData">
import { FlexRender, type Row, type Table } from '@tanstack/vue-table';
import type { VirtualItem } from '@tanstack/vue-virtual';
import { Checkbox } from '@tuquet/vue-ui';
import { computed, ref } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface DataTableCardViewProps<TData> {
  rows: Row<TData>[];
  table?: Table<TData>;
  showSelectAll?: boolean;
  virtual?: boolean;
  virtualRows?: VirtualItem[];
  virtualHeight?: string | number;
  paddingTop?: number;
  paddingBottom?: number;
  measureRow?: (el: any) => void;
}

const props = withDefaults(defineProps<DataTableCardViewProps<TData>>(), {
  table: undefined,
  showSelectAll: true,
  virtual: false,
  virtualRows: () => [],
  virtualHeight: '500px',
  paddingTop: 0,
  paddingBottom: 0,
  measureRow: undefined,
});

const emit = defineEmits<{
  'row-click': [row: Row<TData>, event: MouseEvent];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const locale = useTableLocale();

const hasSelection = computed(() => {
  if (!props.table) return false;
  return (
    props.table.getAllColumns().some((c) => c.id === 'select') ||
    props.table.options.enableRowSelection !== undefined
  );
});

const isAllSelected = computed(() => {
  if (!props.table) return false;
  return props.table.getIsAllPageRowsSelected();
});

const isSomeSelected = computed(() => {
  if (!props.table) return false;
  return props.table.getIsSomePageRowsSelected();
});

const selectedCount = computed(() => {
  if (!props.table) return 0;
  return props.table.getFilteredSelectedRowModel().rows.length;
});

const selectAllText = computed(() => {
  if (isAllSelected.value) {
    return locale.value.code.startsWith('vi') ? 'Bỏ chọn tất cả' : 'Deselect all';
  }
  return locale.value.code.startsWith('vi') ? 'Chọn tất cả' : 'Select all';
});

function selectAll() {
  if (props.table) {
    props.table.toggleAllPageRowsSelected(true);
  } else if (props.rows && props.rows.length > 0) {
    for (const r of props.rows) {
      if (!r.getIsSelected() && (r.getCanSelect?.() ?? true)) {
        r.toggleSelected(true);
      }
    }
  }
}

function deselectAll() {
  if (props.table) {
    props.table.resetRowSelection();
    props.table.toggleAllRowsSelected(false);
    props.table.toggleAllPageRowsSelected(false);
  }
  if (props.rows && props.rows.length > 0) {
    for (const r of props.rows) {
      if (r.getIsSelected()) {
        r.toggleSelected(false);
      }
    }
  }
}

function toggleAll() {
  if (isAllSelected.value) {
    deselectAll();
  } else {
    selectAll();
  }
}

function handleSelectAll(val?: boolean | 'indeterminate') {
  if (val === true) {
    selectAll();
  } else if (val === false) {
    deselectAll();
  } else {
    toggleAll();
  }
}

const computedMaxHeight = computed(() => {
  if (!props.virtual) return undefined;
  return typeof props.virtualHeight === 'number'
    ? `${props.virtualHeight}px`
    : props.virtualHeight;
});

function handleRowClick(row: Row<TData> | undefined, event: MouseEvent) {
  if (!row) return;
  const target = event.target as HTMLElement | null;
  if (
    target?.closest(
      'button, input, [role="checkbox"], a, [role="menuitem"], [data-prevent-row-click]'
    )
  ) {
    return;
  }
  emit('row-click', row, event);
}

function getColumnHeaderLabel(column: any): string {
  const meta = column.columnDef?.meta as { title?: string; label?: string } | undefined;
  if (meta?.title) return meta.title;
  if (meta?.label) return meta.label;
  if (typeof column.columnDef?.header === 'string') {
    return column.columnDef.header;
  }
  const id = column.id || '';
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1').trim();
}

defineExpose({
  containerRef,
  hasSelection,
  isAllSelected,
  isSomeSelected,
  selectedCount,
  handleSelectAll,
  toggleAll,
  selectAll,
  deselectAll,
});
</script>

<template>
  <div
    ref="containerRef"
    class="space-y-2.5 overflow-auto relative p-1"
    :style="computedMaxHeight ? { maxHeight: computedMaxHeight } : undefined"
  >
    <!-- Sticky Mobile Select All Bar -->
    <slot
      v-if="showSelectAll && hasSelection && rows.length > 0"
      name="select-all"
      :is-all-selected="isAllSelected"
      :is-some-selected="isSomeSelected"
      :selected-count="selectedCount"
      :total-count="rows.length"
      :handle-select-all="handleSelectAll"
      :toggle-all="toggleAll"
      :select-all="selectAll"
      :deselect-all="deselectAll"
      :select-all-text="selectAllText"
    >
      <div
        class="sticky top-0 z-20 flex items-center justify-between px-3 py-2 bg-background/95 backdrop-blur-xs border rounded-lg shadow-xs mb-2 transition-colors select-none"
      >
        <div
          class="flex items-center gap-2 cursor-pointer text-xs font-medium hover:text-primary transition-colors py-0.5"
          role="button"
          tabindex="0"
          :aria-label="selectAllText"
          @click="toggleAll"
          @keydown.space.prevent="toggleAll"
          @keydown.enter.prevent="toggleAll"
        >
          <Checkbox
            :checked="isAllSelected ? true : isSomeSelected ? 'indeterminate' : false"
            :model-value="isAllSelected ? true : isSomeSelected ? 'indeterminate' : false"
            :aria-label="selectAllText"
            @click.stop
            @update:checked="handleSelectAll"
            @update:model-value="handleSelectAll"
          />
          <span class="font-medium">{{ selectAllText }}</span>
        </div>
        <div v-if="selectedCount > 0" class="flex items-center gap-2">
          <span class="text-[11px] text-muted-foreground font-mono">
            {{ selectedCount }}/{{ rows.length }}
          </span>
          <button
            type="button"
            class="text-[11px] text-primary hover:underline font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
            @click.stop="deselectAll"
          >
            {{ locale.messages.floatingBar.clear }}
          </button>
        </div>
      </div>
    </slot>

    <!-- Virtualized Rendering -->
    <template v-if="virtual">
      <div v-if="paddingTop > 0" :style="{ height: `${paddingTop}px` }" />
      <div
        v-for="virtualRow in virtualRows"
        :key="rows[virtualRow.index]?.id ?? virtualRow.index"
        :data-index="virtualRow.index"
        :ref="measureRow"
        class="rounded-xl border bg-card p-3 shadow-xs transition-colors hover:bg-muted/40 cursor-pointer"
        :class="
          rows[virtualRow.index]?.getIsSelected()
            ? 'ring-2 ring-primary/40 bg-muted/30'
            : ''
        "
        @click="(e) => handleRowClick(rows[virtualRow.index], e)"
      >
        <slot
          name="card"
          :row="rows[virtualRow.index]"
          :index="virtualRow.index"
          :is-selected="rows[virtualRow.index]?.getIsSelected()"
          :toggle-selected="() => rows[virtualRow.index]?.toggleSelected()"
        >
          <!-- Default Card Layout -->
          <div class="flex items-center justify-between gap-2 border-b pb-2 mb-2">
            <div class="flex items-center gap-2">
              <Checkbox
                v-if="hasSelection && (rows[virtualRow.index]?.getCanSelect?.() ?? true)"
                :checked="rows[virtualRow.index]?.getIsSelected()"
                :aria-label="`Select row ${virtualRow.index + 1}`"
                @click.stop
                @update:checked="(val) => rows[virtualRow.index]?.toggleSelected(!!val)"
              />
              <span class="font-mono text-xs font-semibold text-primary">
                #{{ virtualRow.index + 1 }}
              </span>
            </div>
            <div class="flex items-center gap-1.5" data-prevent-row-click>
              <template
                v-for="cell in rows[virtualRow.index]
                  ?.getVisibleCells()
                  .filter(
                    (c) => c.column.id === 'status' || c.column.id === 'actions'
                  )"
                :key="cell.id"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </template>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <template
              v-for="cell in rows[virtualRow.index]
                ?.getVisibleCells()
                .filter(
                  (c) =>
                    !['select', 'index', 'status', 'actions'].includes(c.column.id)
                )"
              :key="cell.id"
            >
              <div class="flex flex-col min-w-0">
                <span
                  class="text-[10px] text-muted-foreground uppercase font-medium"
                >
                  {{ getColumnHeaderLabel(cell.column) }}
                </span>
                <div class="mt-0.5 font-medium truncate">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </div>
              </div>
            </template>
          </div>
        </slot>
      </div>
      <div v-if="paddingBottom > 0" :style="{ height: `${paddingBottom}px` }" />
    </template>

    <!-- Standard (Non-virtualized) Rendering -->
    <template v-else>
      <div
        v-for="(row, idx) in rows"
        :key="row.id"
        class="rounded-xl border bg-card p-3 shadow-xs transition-colors hover:bg-muted/40 cursor-pointer"
        :class="row.getIsSelected() ? 'ring-2 ring-primary/40 bg-muted/30' : ''"
        @click="(e) => handleRowClick(row, e)"
      >
        <slot
          name="card"
          :row="row"
          :index="idx"
          :is-selected="row.getIsSelected()"
          :toggle-selected="() => row.toggleSelected()"
        >
          <!-- Default Card Layout -->
          <div class="flex items-center justify-between gap-2 border-b pb-2 mb-2">
            <div class="flex items-center gap-2">
              <Checkbox
                v-if="hasSelection && (row.getCanSelect?.() ?? true)"
                :checked="row.getIsSelected()"
                :aria-label="`Select row ${idx + 1}`"
                @click.stop
                @update:checked="(val) => row.toggleSelected(!!val)"
              />
              <span class="font-mono text-xs font-semibold text-primary">
                #{{ idx + 1 }}
              </span>
            </div>
            <div class="flex items-center gap-1.5" data-prevent-row-click>
              <template
                v-for="cell in row
                  .getVisibleCells()
                  .filter(
                    (c) => c.column.id === 'status' || c.column.id === 'actions'
                  )"
                :key="cell.id"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </template>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <template
              v-for="cell in row
                .getVisibleCells()
                .filter(
                  (c) =>
                    !['select', 'index', 'status', 'actions'].includes(c.column.id)
                )"
              :key="cell.id"
            >
              <div class="flex flex-col min-w-0">
                <span
                  class="text-[10px] text-muted-foreground uppercase font-medium"
                >
                  {{ getColumnHeaderLabel(cell.column) }}
                </span>
                <div class="mt-0.5 font-medium truncate">
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </div>
              </div>
            </template>
          </div>
        </slot>
      </div>
    </template>
  </div>
</template>
