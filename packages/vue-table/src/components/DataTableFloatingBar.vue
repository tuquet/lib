<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from '@tuquet/vue-ui';
import { onKeyStroke } from '@vueuse/core';
import { X, MoreHorizontal } from 'lucide-vue-next';
import { computed, useSlots } from 'vue';
import { useTableLocale } from '../locale/index.js';
import { resolveBulkActionsConfig } from '../helpers/configResolver.js';
import type { BulkActionItem, BulkActionsConfig } from '../types/config.js';

export interface DataTableFloatingBarProps<TData> {
  table: Table<TData>;
  /**
   * Total count of records if known
   */
  totalCount?: number;
  /**
   * Bulk actions configuration object or boolean
   */
  config?: boolean | BulkActionsConfig<TData>;
  /**
   * Directly provided bulk action items
   */
  actions?: BulkActionItem<TData>[];
}

const props = defineProps<DataTableFloatingBarProps<TData>>();

const emit = defineEmits<{
  clear: [];
}>();

const slots = useSlots();
const locale = useTableLocale();

const selectedRowModels = computed(() => props.table.getFilteredSelectedRowModel().rows);
const selectedRows = computed(() => selectedRowModels.value.map((r) => r.original));
const selectedCount = computed(() => selectedRowModels.value.length);
const isVisible = computed(() => selectedCount.value > 0);

const resolvedConfig = computed(() => {
  if (props.actions && props.actions.length > 0) {
    return { enabled: true, actions: props.actions, maxVisibleOnMobile: 2 };
  }
  return resolveBulkActionsConfig(props.config);
});

const builtInActions = computed<BulkActionItem<TData>[]>(() => resolvedConfig.value?.actions ?? []);
const maxVisibleOnMobile = computed(() => resolvedConfig.value?.maxVisibleOnMobile ?? 2);

// Visible on mobile directly vs overflow dropdown
const visibleMobileActions = computed(() => builtInActions.value.slice(0, maxVisibleOnMobile.value));
const overflowMobileActions = computed(() => builtInActions.value.slice(maxVisibleOnMobile.value));

function getActionLabel(action: BulkActionItem<TData>): string {
  return typeof action.label === 'function' ? action.label(selectedCount.value) : action.label;
}

function getActionShortLabel(action: BulkActionItem<TData>): string {
  if (action.shortLabel) {
    return typeof action.shortLabel === 'function' ? action.shortLabel(selectedCount.value) : action.shortLabel;
  }
  return getActionLabel(action);
}

async function executeAction(action: BulkActionItem<TData>) {
  if (action.disabled?.(selectedRows.value)) return;
  if (action.confirm) {
    const ok = window.confirm(`${action.confirm.title}\n\n${action.confirm.description}`);
    if (!ok) return;
  }
  await action.handler(selectedRows.value, props.table);
}

function handleClear() {
  props.table.resetRowSelection();
  resolvedConfig.value?.onClear?.();
  emit('clear');
}

onKeyStroke('Escape', (e) => {
  if (isVisible.value) {
    e.preventDefault();
    handleClear();
  }
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform translate-y-6 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-6 opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-3 sm:bottom-6 inset-x-2 sm:inset-x-0 mx-auto w-fit max-w-[calc(100vw-1rem)] sm:max-w-2xl z-50 flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2.5 rounded-full border bg-background/95 p-1.5 sm:px-4 sm:py-2 shadow-2xl backdrop-blur-md dark:border-border pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] sm:pb-2"
      role="toolbar"
      aria-label="Bulk actions toolbar"
    >
      <!-- Selected Counter: Compact badge on Mobile, Full localized text on Desktop -->
      <Badge
        variant="secondary"
        class="sm:hidden rounded-full px-2 py-0.5 text-xs font-mono font-bold shrink-0 bg-primary/10 text-primary"
      >
        {{ selectedCount }}
      </Badge>
      <Badge
        variant="secondary"
        class="hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0"
      >
        {{ locale.messages.floatingBar.selected(selectedCount, totalCount) }}
      </Badge>

      <Separator orientation="vertical" class="h-4 shrink-0" />

      <!-- Actions Container: Slot takes precedence, otherwise auto-render built-in actions -->
      <div class="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shrink">
        <slot
          name="actions"
          :selected-rows="selectedRowModels"
          :selected-count="selectedCount"
          :table="table"
        >
          <!-- Auto-rendered Built-In Actions from Object Config -->
          <!-- Desktop: all actions visible -->
          <template v-for="action in builtInActions" :key="action.key">
            <Button
              :variant="action.variant ?? 'outline'"
              size="sm"
              class="hidden sm:inline-flex h-7 px-2.5 text-xs gap-1.5 shrink-0"
              :disabled="action.disabled?.(selectedRows)"
              @click="executeAction(action)"
            >
              <component :is="action.icon" v-if="action.icon" class="h-3.5 w-3.5 shrink-0" />
              <span>{{ getActionLabel(action) }}</span>
            </Button>
          </template>

          <!-- Mobile: first N actions visible -->
          <template v-for="action in visibleMobileActions" :key="'mob-' + action.key">
            <Button
              :variant="action.variant ?? 'outline'"
              size="sm"
              class="sm:hidden h-7 px-2 text-xs gap-1 shrink-0"
              :disabled="action.disabled?.(selectedRows)"
              @click="executeAction(action)"
            >
              <component :is="action.icon" v-if="action.icon" class="h-3.5 w-3.5 shrink-0" />
              <span class="text-[11px] font-medium">{{ getActionShortLabel(action) }}</span>
            </Button>
          </template>

          <!-- Mobile Overflow Menu for remaining actions -->
          <DropdownMenu v-if="overflowMobileActions.length > 0">
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="sm:hidden h-7 w-7 p-0 rounded-full shrink-0"
                title="Thêm hành động"
              >
                <MoreHorizontal class="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44 text-xs">
              <DropdownMenuItem
                v-for="action in overflowMobileActions"
                :key="'overflow-' + action.key"
                class="gap-2 cursor-pointer"
                :disabled="action.disabled?.(selectedRows)"
                @click="executeAction(action)"
              >
                <component :is="action.icon" v-if="action.icon" class="h-3.5 w-3.5" />
                <span>{{ getActionLabel(action) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </slot>
      </div>

      <Separator orientation="vertical" class="h-4 shrink-0" />

      <!-- Clear Button: Compact icon on Mobile, Icon + Label + Esc Kbd on Desktop -->
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 sm:w-auto sm:px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-full shrink-0"
        :title="`${locale.messages.floatingBar.clear} (Esc)`"
        :aria-label="locale.messages.floatingBar.clear"
        @click="handleClear"
      >
        <X class="h-3.5 w-3.5 sm:mr-1" />
        <span class="hidden sm:inline">{{ locale.messages.floatingBar.clear }}</span>
        <kbd class="ml-1.5 hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          Esc
        </kbd>
      </Button>
    </div>
  </Transition>
</template>
