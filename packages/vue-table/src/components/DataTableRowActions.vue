<script setup lang="ts" generic="TData">
import type { Row } from '@tanstack/vue-table';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tuquet/vue-ui';
import { MoreHorizontal } from 'lucide-vue-next';
import type { Component } from 'vue';

export interface RowActionItem<TData> {
  id: string;
  label: string;
  icon?: Component;
  variant?: 'default' | 'destructive';
  disabled?: boolean | ((row: Row<TData>) => boolean);
  hidden?: boolean | ((row: Row<TData>) => boolean);
  separator?: boolean;
  onSelect?: (row: Row<TData>) => void;
}

export interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  actions?: RowActionItem<TData>[];
}

const props = defineProps<DataTableRowActionsProps<TData>>();

const emit = defineEmits<{
  action: [actionId: string, row: Row<TData>];
}>();

function isHidden(action: RowActionItem<TData>): boolean {
  if (typeof action.hidden === 'function') {
    return action.hidden(props.row);
  }
  return !!action.hidden;
}

function isDisabled(action: RowActionItem<TData>): boolean {
  if (typeof action.disabled === 'function') {
    return action.disabled(props.row);
  }
  return !!action.disabled;
}

function handleSelect(action: RowActionItem<TData>) {
  if (action.onSelect) {
    action.onSelect(props.row);
  }
  emit('action', action.id, props.row);
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        aria-label="Open row actions menu"
      >
        <MoreHorizontal class="h-4 w-4" />
        <span class="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[160px]">
      <slot :row="row">
        <template v-for="(action, index) in actions" :key="action.id">
          <DropdownMenuSeparator v-if="action.separator && index > 0" />
          <DropdownMenuItem
            v-if="!isHidden(action)"
            :disabled="isDisabled(action)"
            :class="action.variant === 'destructive' ? 'text-destructive focus:bg-destructive/10 focus:text-destructive' : ''"
            @select="handleSelect(action)"
          >
            <component :is="action.icon" v-if="action.icon" class="mr-2 h-4 w-4" />
            <span>{{ action.label }}</span>
          </DropdownMenuItem>
        </template>
      </slot>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
