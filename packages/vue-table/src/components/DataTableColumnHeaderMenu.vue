<script setup lang="ts" generic="TData">
import type { Column } from '@tanstack/vue-table';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tuquet/vue-ui';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EyeOff,
  MoreVertical,
  Pin,
  PinOff,
  RotateCcw,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface DataTableColumnHeaderMenuProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  enableSorting?: boolean;
  enablePinning?: boolean;
  enableHiding?: boolean;
  enableResizing?: boolean;
}

const props = withDefaults(defineProps<DataTableColumnHeaderMenuProps<TData>>(), {
  title: '',
  enableSorting: true,
  enablePinning: true,
  enableHiding: true,
  enableResizing: true,
});

const locale = useTableLocale();

const isSorted = computed(() => props.column.getIsSorted());
const isPinned = computed(() => props.column.getIsPinned());

const canSort = computed(() => props.enableSorting && props.column.getCanSort());
const canPin = computed(() => props.enablePinning && props.column.getCanPin());
const canHide = computed(() => props.enableHiding && props.column.getCanHide());
const canResize = computed(() => props.enableResizing && props.column.getCanResize());
</script>

<template>
  <div class="flex items-center justify-between gap-1.5 w-full">
    <!-- Header title / Click to Sort shortcut -->
    <div
      v-if="canSort"
      class="flex items-center gap-1 cursor-pointer select-none font-medium hover:text-foreground text-xs sm:text-sm text-muted-foreground transition-colors truncate"
      @click="column.toggleSorting()"
    >
      <slot>
        <span class="truncate">{{ title }}</span>
      </slot>

      <span v-if="isSorted === 'asc'" class="inline-flex text-primary">
        <ArrowUp class="h-3.5 w-3.5" />
      </span>
      <span v-else-if="isSorted === 'desc'" class="inline-flex text-primary">
        <ArrowDown class="h-3.5 w-3.5" />
      </span>
      <span v-else class="inline-flex opacity-0 group-hover:opacity-60 transition-opacity">
        <ArrowUpDown class="h-3 w-3" />
      </span>
    </div>
    <div v-else class="font-medium text-xs sm:text-sm text-muted-foreground truncate">
      <slot>
        <span class="truncate">{{ title }}</span>
      </slot>
    </div>

    <!-- Excel-style Column Action Dropdown Trigger -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-sm data-[state=open]:bg-muted"
          :title="title ? `${title} - ${locale.messages.headerMenu.openMenu || 'Menu'}` : (locale.messages.headerMenu.openMenu || 'Column options')"
          @click.stop
        >
          <MoreVertical class="h-3.5 w-3.5" />
          <span class="sr-only">{{ locale.messages.headerMenu.openMenu || 'Open column menu' }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-48 text-xs">
        <!-- Sorting Actions -->
        <template v-if="canSort">
          <DropdownMenuItem
            class="gap-2 cursor-pointer"
            :class="{ 'font-semibold text-primary': isSorted === 'asc' }"
            @click="column.toggleSorting(false)"
          >
            <ArrowUp class="h-3.5 w-3.5 text-muted-foreground" />
            <span>{{ locale.messages.headerMenu.sortAsc }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            class="gap-2 cursor-pointer"
            :class="{ 'font-semibold text-primary': isSorted === 'desc' }"
            @click="column.toggleSorting(true)"
          >
            <ArrowDown class="h-3.5 w-3.5 text-muted-foreground" />
            <span>{{ locale.messages.headerMenu.sortDesc }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isSorted"
            class="gap-2 cursor-pointer text-muted-foreground"
            @click="column.clearSorting()"
          >
            <ArrowUpDown class="h-3.5 w-3.5" />
            <span>{{ locale.messages.headerMenu.clearSort }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </template>

        <!-- Pinning Actions -->
        <template v-if="canPin">
          <DropdownMenuItem
            class="gap-2 cursor-pointer"
            :class="{ 'font-semibold text-primary': isPinned === 'left' }"
            @click="column.pin('left')"
          >
            <Pin class="h-3.5 w-3.5 text-muted-foreground rotate-45" />
            <span>{{ locale.messages.headerMenu.pinLeft }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            class="gap-2 cursor-pointer"
            :class="{ 'font-semibold text-primary': isPinned === 'right' }"
            @click="column.pin('right')"
          >
            <Pin class="h-3.5 w-3.5 text-muted-foreground -rotate-45" />
            <span>{{ locale.messages.headerMenu.pinRight }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="isPinned"
            class="gap-2 cursor-pointer text-muted-foreground"
            @click="column.pin(false)"
          >
            <PinOff class="h-3.5 w-3.5" />
            <span>{{ locale.messages.headerMenu.unpin }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </template>

        <!-- Sizing Actions -->
        <template v-if="canResize">
          <DropdownMenuItem class="gap-2 cursor-pointer" @click="column.resetSize()">
            <RotateCcw class="h-3.5 w-3.5 text-muted-foreground" />
            <span>{{ locale.messages.headerMenu.resetSize }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canHide" />
        </template>

        <!-- Hide Column Action -->
        <template v-if="canHide">
          <DropdownMenuItem class="gap-2 cursor-pointer text-destructive focus:text-destructive" @click="column.toggleVisibility(false)">
            <EyeOff class="h-3.5 w-3.5" />
            <span>{{ locale.messages.headerMenu.hideColumn }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
