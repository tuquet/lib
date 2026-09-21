<script setup lang="ts">
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@tuquet/vue-ui';
import { Bookmark, Check, Plus, RotateCcw, Save, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import type { UseSavedViewsReturn } from '../composables/useSavedViews.js';
import { useTableLocale } from '../locale/index.js';
import type { TableSavedViewState } from '../types/savedViews.js';

export interface DataTableSavedViewsProps {
  savedViews: UseSavedViewsReturn;
  getCurrentState: () => TableSavedViewState;
}

const props = defineProps<DataTableSavedViewsProps>();

const locale = useTableLocale();
const newViewName = ref('');
const isCreating = ref(false);

const handleSaveNewView = () => {
  if (!newViewName.value.trim()) return;
  const currentState = props.getCurrentState();
  props.savedViews.saveView(newViewName.value, currentState);
  newViewName.value = '';
  isCreating.value = false;
};

const handleUpdateCurrentView = () => {
  const activeId = props.savedViews.activeViewId.value;
  if (!activeId) return;
  const currentState = props.getCurrentState();
  props.savedViews.updateView(activeId, currentState);
};

const handleDelete = (viewId: string, event: Event) => {
  event.stopPropagation();
  if (typeof window !== 'undefined' && window.confirm) {
    if (!window.confirm(locale.value.messages.savedViews.confirmDelete)) {
      return;
    }
  }
  props.savedViews.deleteView(viewId);
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-8 gap-1.5 px-3 text-xs font-medium shadow-2xs"
      >
        <Bookmark class="h-3.5 w-3.5 text-primary" />
        <span class="max-w-[120px] truncate">
          {{ savedViews.activeView.value ? savedViews.activeView.value.name : locale.messages.savedViews.defaultView }}
        </span>
        <Badge
          v-if="savedViews.activeView.value"
          variant="secondary"
          class="h-4 px-1 text-[10px] font-normal leading-none"
        >
          {{ locale.messages.savedViews.customViewBadge }}
        </Badge>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" class="w-64 text-xs">
      <DropdownMenuLabel class="flex items-center justify-between text-xs text-muted-foreground font-semibold">
        <span>{{ locale.messages.savedViews.viewsTitle }}</span>
        <Button
          v-if="!isCreating"
          variant="ghost"
          size="icon"
          class="h-5 w-5 p-0 text-primary hover:text-primary/80"
          :title="locale.messages.savedViews.saveAsNewView"
          :aria-label="locale.messages.savedViews.saveAsNewView"
          @click.stop="isCreating = true"
        >
          <Plus class="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuLabel>

      <!-- Inline view creation input -->
      <div v-if="isCreating" class="p-2 pt-0 flex items-center gap-1.5" @click.stop>
        <Input
          v-model="newViewName"
          :placeholder="locale.messages.savedViews.viewNamePlaceholder"
          class="h-7 text-xs flex-1"
          auto-focus
          @keydown.enter.prevent="handleSaveNewView"
          @keydown.esc.prevent="isCreating = false"
        />
        <Button size="sm" class="h-7 px-2 text-xs" @click.stop="handleSaveNewView">
          {{ locale.messages.savedViews.saveButton }}
        </Button>
      </div>

      <!-- Update active view option -->
      <template v-if="savedViews.activeView.value">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="flex items-center gap-2 cursor-pointer py-1.5 text-primary font-medium"
          @click="handleUpdateCurrentView"
        >
          <Save class="h-3.5 w-3.5" />
          <span class="truncate">{{ locale.messages.savedViews.saveCurrentView }}</span>
        </DropdownMenuItem>
      </template>

      <DropdownMenuSeparator />

      <!-- Default View Option -->
      <DropdownMenuItem
        class="flex items-center justify-between cursor-pointer py-1.5"
        :class="{ 'font-semibold text-primary': !savedViews.activeViewId.value }"
        @click="savedViews.resetToDefault()"
      >
        <div class="flex items-center gap-2 truncate">
          <RotateCcw class="h-3.5 w-3.5 text-muted-foreground" />
          <span class="truncate">{{ locale.messages.savedViews.defaultView }}</span>
        </div>
        <Check v-if="!savedViews.activeViewId.value" class="h-3.5 w-3.5 text-primary shrink-0" />
      </DropdownMenuItem>

      <!-- Custom Saved Views List -->
      <template v-if="savedViews.views.value.length > 0">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-for="view in savedViews.views.value"
          :key="view.id"
          class="flex items-center justify-between cursor-pointer py-1.5 group"
          :class="{ 'font-semibold text-primary': savedViews.activeViewId.value === view.id }"
          @click="savedViews.applyView(view)"
        >
          <div class="flex items-center gap-2 truncate">
            <Bookmark class="h-3.5 w-3.5 text-muted-foreground" />
            <span class="truncate">{{ view.name }}</span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <Check v-if="savedViews.activeViewId.value === view.id" class="h-3.5 w-3.5 text-primary mr-1" />
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity"
              :title="locale.messages.savedViews.deleteView"
              :aria-label="locale.messages.savedViews.deleteView"
              @click="handleDelete(view.id, $event)"
            >
              <Trash2 class="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
