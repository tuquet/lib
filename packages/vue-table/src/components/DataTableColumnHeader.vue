<script setup lang="ts" generic="TData, TValue">
import type { Column } from '@tanstack/vue-table';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tuquet/vue-ui';
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-vue-next';
import { useTableLocale } from '../locale/index.js';
import type { HTMLAttributes } from 'vue';

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  class?: HTMLAttributes['class'];
}

const props = defineProps<DataTableColumnHeaderProps<TData, TValue>>();
const locale = useTableLocale();
</script>

<template>
  <div v-if="column.getCanSort()" :class="['flex items-center space-x-2', props.class]">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <span>{{ title }}</span>
          <ArrowDown
            v-if="column.getIsSorted() === 'desc'"
            class="ml-2 h-4 w-4"
          />
          <ArrowUp
            v-else-if="column.getIsSorted() === 'asc'"
            class="ml-2 h-4 w-4"
          />
          <ArrowUpDown
            v-else
            class="ml-2 h-4 w-4 text-muted-foreground"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem @click="column.toggleSorting(false)">
          <ArrowUp class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ locale.messages.headerMenu.sortAsc }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="column.toggleSorting(true)">
          <ArrowDown class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ locale.messages.headerMenu.sortDesc }}
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="column.getIsSorted()"
          @click="column.clearSorting()"
        >
          <ArrowUpDown class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ locale.messages.headerMenu.clearSort }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="column.toggleVisibility(false)">
          <EyeOff class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ locale.messages.headerMenu.hideColumn }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  <div v-else :class="props.class">
    {{ title }}
  </div>
</template>
