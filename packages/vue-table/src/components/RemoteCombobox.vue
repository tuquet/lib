<script setup lang="ts" generic="TOption, TValue extends string | number = string | number">
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tuquet/vue-ui';
import { useIntersectionObserver } from '@vueuse/core';
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useTableLocale } from '../locale/index.js';
import {
  useRemoteInfiniteSelect,
  type RemoteSelectFetchParams,
  type RemoteSelectFetchResult,
} from '../composables/useRemoteInfiniteSelect.js';

export interface RemoteComboboxProps<
  TOption,
  TValue extends string | number = string | number,
> {
  modelValue?: TValue | TValue[] | null;
  multiple?: boolean;
  fetcher: (params: RemoteSelectFetchParams) => Promise<RemoteSelectFetchResult<TOption>>;
  resolveValue?: (val: TValue) => Promise<TOption | null>;
  valueKey?: keyof TOption | ((item: TOption) => TValue);
  labelKey?: keyof TOption | ((item: TOption) => string);
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onCreate?: (search: string) => Promise<TOption | void>;
  onDelete?: (item: TOption) => Promise<boolean | void>;
  canCreate?: boolean | ((search: string) => boolean);
  canDelete?: boolean | ((item: TOption) => boolean);
  confirmDelete?: boolean | ((item: TOption) => string);
  disabled?: boolean;
  pageSize?: number;
  debounceMs?: number;
}

const props = withDefaults(
  defineProps<RemoteComboboxProps<TOption, TValue>>(),
  {
    modelValue: undefined,
    multiple: false,
    resolveValue: undefined,
    valueKey: 'id' as keyof TOption,
    labelKey: 'name' as keyof TOption,
    placeholder: undefined,
    searchPlaceholder: undefined,
    emptyText: undefined,
    onCreate: undefined,
    onDelete: undefined,
    canCreate: true,
    canDelete: true,
    confirmDelete: true,
    disabled: false,
    pageSize: 20,
    debounceMs: 250,
  }
);

const locale = useTableLocale();
const isVi = computed(() => locale.value.code.startsWith('vi'));

const effectivePlaceholder = computed(() => props.placeholder ?? (isVi.value ? 'Chọn giá trị...' : 'Select option...'));
const effectiveSearchPlaceholder = computed(() => props.searchPlaceholder ?? locale.value.messages.toolbar.searchPlaceholder);
const effectiveEmptyText = computed(() => props.emptyText ?? locale.value.messages.general.emptyMessage);

const selectedCountLabel = (count: number) => isVi.value ? `${count} đã chọn` : `${count} selected`;
const clearSelectionLabel = computed(() => isVi.value ? 'Xóa lựa chọn' : 'Clear selection');
const loadingText = computed(() => isVi.value ? 'Đang tải danh sách...' : 'Loading options...');
const loadingMoreText = computed(() => isVi.value ? 'Đang tải thêm...' : 'Loading more...');
const createNewText = (term: string) => isVi.value ? `Tạo mới: "${term}"` : `Create new: "${term}"`;
const deleteConfirmText = computed(() => isVi.value ? 'Xóa?' : 'Delete?');
const yesText = computed(() => isVi.value ? 'Có' : 'Yes');
const cancelText = computed(() => locale.value.messages.cell.cancel.replace(/\s*\(.*?\)/, ''));
const deleteItemTitle = computed(() => isVi.value ? 'Xóa mục này' : 'Delete this item');
const allLoadedText = (count: number) => isVi.value ? `Đã hiển thị toàn bộ ${count} mục` : `Showing all ${count} items`;

const emit = defineEmits<{
  'update:modelValue': [value: TValue | TValue[] | undefined];
  change: [value: TValue | TValue[] | undefined, item: TOption | TOption[] | undefined];
  create: [item: TOption];
  delete: [item: TOption];
}>();

const isOpen = ref(false);
const confirmingDeleteId = ref<string | null>(null);
const sentinelEl = ref<HTMLElement | null>(null);

const internalModelValue = ref(props.modelValue ?? undefined);

watch(
  () => props.modelValue,
  (val) => {
    internalModelValue.value = val ?? undefined;
  }
);

const selectEngine = useRemoteInfiniteSelect<TOption, TValue>({
  fetcher: props.fetcher,
  resolveValue: props.resolveValue,
  modelValue: internalModelValue as any,
  valueKey: props.valueKey,
  labelKey: props.labelKey,
  onCreate: props.onCreate,
  onDelete: props.onDelete,
  canCreate: props.canCreate,
  canDelete: props.canDelete,
  pageSize: props.pageSize,
  debounceMs: props.debounceMs,
});

const {
  items,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  searchQuery,
  resolvedItem,
  deletingIds,
  isCreating,
  loadMore,
  setSearch,
  createItem,
  deleteItem,
  refresh,
  getItemValue,
  getItemLabel,
} = selectEngine;

// Sentinel intersection observer for infinite scroll
useIntersectionObserver(sentinelEl, ([entry]) => {
  if (entry?.isIntersecting && hasMore.value && !isLoadingMore.value && !isLoading.value) {
    loadMore();
  }
});

// Refresh list whenever dropdown is opened
watch(isOpen, (open) => {
  if (open) {
    confirmingDeleteId.value = null;
    if (items.value.length === 0) {
      refresh();
    }
  }
});

const isSelected = (item: TOption): boolean => {
  const val = getItemValue(item);
  if (props.multiple && Array.isArray(props.modelValue)) {
    return (props.modelValue as TValue[]).includes(val);
  }
  return props.modelValue === val;
};

const selectedItemOrItems = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const valSet = new Set(props.modelValue as TValue[]);
    return items.value.filter((it) => valSet.has(getItemValue(it)));
  }
  if (props.modelValue !== undefined && props.modelValue !== null) {
    const found = items.value.find((it) => getItemValue(it) === props.modelValue);
    return found || resolvedItem.value || null;
  }
  return null;
});

const displayLabel = computed(() => {
  if (props.multiple && Array.isArray(selectedItemOrItems.value)) {
    return selectedCountLabel(selectedItemOrItems.value.length);
  }
  if (selectedItemOrItems.value && !Array.isArray(selectedItemOrItems.value)) {
    return getItemLabel(selectedItemOrItems.value as TOption);
  }
  return null;
});

function handleSelect(item: TOption) {
  const val = getItemValue(item);

  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(val);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(val);
    }
    emit('update:modelValue', current);
    emit('change', current, selectedItemOrItems.value as TOption[]);
  } else {
    emit('update:modelValue', val);
    emit('change', val, item);
    isOpen.value = false;
  }
}

function handleClear(e?: Event) {
  e?.stopPropagation();
  const nextVal = props.multiple ? [] : undefined;
  emit('update:modelValue', nextVal);
  emit('change', nextVal, undefined);
}

const showCreateOption = computed(() => {
  if (!props.onCreate) return false;
  const q = searchQuery.value.trim();
  if (!q) return false;
  if (typeof props.canCreate === 'function') {
    return props.canCreate(q);
  }
  if (props.canCreate === false) return false;

  // Check if query already exactly matches an existing item
  return !items.value.some((it) => getItemLabel(it).toLowerCase() === q.toLowerCase());
});

async function handleCreate() {
  const q = searchQuery.value.trim();
  if (!q) return;

  const newItem = await createItem(q);
  if (newItem) {
    emit('create', newItem);
    const val = getItemValue(newItem);
    if (props.multiple) {
      const current = Array.isArray(props.modelValue) ? [...props.modelValue, val] : [val];
      emit('update:modelValue', current);
      emit('change', current, selectedItemOrItems.value as TOption[]);
    } else {
      emit('update:modelValue', val);
      emit('change', val, newItem);
      isOpen.value = false;
    }
  }
}

function isItemDeletable(item: TOption): boolean {
  if (!props.onDelete) return false;
  if (typeof props.canDelete === 'function') {
    return props.canDelete(item);
  }
  return !!props.canDelete;
}

function requestDelete(e: Event, item: TOption) {
  e.stopPropagation();
  e.preventDefault();
  const idStr = String(getItemValue(item));

  if (props.confirmDelete) {
    confirmingDeleteId.value = idStr;
  } else {
    confirmDeleteExecution(item);
  }
}

async function confirmDeleteExecution(item: TOption) {
  confirmingDeleteId.value = null;
  const success = await deleteItem(item);
  if (success) {
    emit('delete', item);
    // If deleted item was active, emit change
    const val = getItemValue(item);
    if (props.modelValue === val) {
      emit('update:modelValue', undefined);
      emit('change', undefined, undefined);
    }
  }
}

function cancelDelete(e: Event) {
  e.stopPropagation();
  e.preventDefault();
  confirmingDeleteId.value = null;
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="isOpen"
        :disabled="disabled"
        class="h-9 w-full justify-between font-normal text-xs px-3"
      >
        <div class="flex items-center gap-1.5 truncate">
          <span v-if="displayLabel" class="truncate font-medium text-foreground">
            {{ displayLabel }}
          </span>
          <span v-else class="truncate text-muted-foreground">
            {{ effectivePlaceholder }}
          </span>
        </div>

        <div class="flex items-center gap-1 shrink-0 ml-2">
          <span
            v-if="modelValue !== undefined && modelValue !== null && (Array.isArray(modelValue) ? modelValue.length > 0 : true)"
            role="button"
            tabindex="0"
            :aria-label="clearSelectionLabel"
            class="rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none"
            @click.stop="handleClear"
            @keydown.enter.stop="handleClear"
            @keydown.space.stop="handleClear"
          >
            <X class="h-3.5 w-3.5" />
          </span>
          <ChevronsUpDown class="h-3.5 w-3.5 opacity-50" />
        </div>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-[var(--radix-popover-trigger-width,260px)] p-0" align="start">
      <Command>
        <CommandInput
          :placeholder="effectiveSearchPlaceholder"
          class="h-9 text-xs"
          @update:model-value="(val) => setSearch(String(val))"
        />

        <CommandList class="max-h-60 overflow-y-auto">
          <!-- Loading Initial State -->
          <div
            v-if="isLoading"
            class="flex items-center justify-center p-4 text-xs text-muted-foreground gap-2"
          >
            <Loader2 class="h-4 w-4 animate-spin text-primary" />
            <span>{{ loadingText }}</span>
          </div>

          <!-- Empty State -->
          <CommandEmpty v-else-if="items.length === 0 && !showCreateOption" class="py-4 text-xs text-muted-foreground">
            {{ effectiveEmptyText }}
          </CommandEmpty>

          <!-- Create Option -->
          <CommandGroup v-if="showCreateOption">
            <CommandItem
              value="__create_new_item__"
              class="flex items-center gap-2 cursor-pointer text-xs font-medium text-primary hover:bg-accent"
              @select="handleCreate"
            >
              <Plus class="h-3.5 w-3.5 text-primary" />
              <span>{{ createNewText(searchQuery.trim()) }}</span>
              <Loader2 v-if="isCreating" class="h-3 w-3 animate-spin ml-auto" />
            </CommandItem>
          </CommandGroup>

          <!-- Options List -->
          <CommandGroup v-if="items.length > 0">
            <CommandItem
              v-for="item in items"
              :key="String(getItemValue(item))"
              :value="String(getItemValue(item))"
              class="group flex items-center justify-between text-xs cursor-pointer py-2 px-2.5"
              @select="() => handleSelect(item)"
            >
              <!-- Left side: Check indicator + Label / Slot -->
              <div class="flex items-center gap-2 truncate flex-1 mr-2">
                <Check
                  class="h-3.5 w-3.5 shrink-0"
                  :class="isSelected(item) ? 'opacity-100 text-primary' : 'opacity-0'"
                />
                <slot name="option" :option="item" :is-selected="isSelected(item)">
                  <span class="truncate" :class="{ 'font-medium': isSelected(item) }">
                    {{ getItemLabel(item) }}
                  </span>
                </slot>
              </div>

              <!-- Right side: Delete button or Confirmation -->
              <div
                v-if="isItemDeletable(item)"
                class="shrink-0 flex items-center"
                @click.stop
              >
                <!-- Confirming Delete State -->
                <div
                  v-if="confirmingDeleteId === String(getItemValue(item))"
                  class="flex items-center gap-1 bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-[11px]"
                >
                  <span>{{ deleteConfirmText }}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-5 px-1.5 text-[10px] text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    @click.stop="() => confirmDeleteExecution(item)"
                  >
                    {{ yesText }}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-5 px-1.5 text-[10px] text-muted-foreground hover:bg-accent"
                    @click.stop="cancelDelete"
                  >
                    {{ cancelText }}
                  </Button>
                </div>

                <!-- Regular Trash Icon (Hover to show) -->
                <Button
                  v-else
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  :title="deleteItemTitle"
                  :aria-label="deleteItemTitle"
                  :disabled="deletingIds[String(getItemValue(item))]"
                  @click.stop="(e) => requestDelete(e, item)"
                >
                  <Loader2
                    v-if="deletingIds[String(getItemValue(item))]"
                    class="h-3 w-3 animate-spin text-destructive"
                  />
                  <Trash2 v-else class="h-3.5 w-3.5" />
                </Button>
              </div>
            </CommandItem>
          </CommandGroup>

          <!-- Infinite Scroll Sentinel & Loader -->
          <div ref="sentinelEl" class="py-2 text-center text-xs text-muted-foreground">
            <div v-if="isLoadingMore" class="flex items-center justify-center gap-1.5 py-1">
              <Loader2 class="h-3.5 w-3.5 animate-spin text-primary" />
              <span>{{ loadingMoreText }}</span>
            </div>
            <div v-else-if="!hasMore && items.length > 0" class="text-[11px] text-muted-foreground/60 py-1">
              {{ allLoadedText(total) }}
            </div>
          </div>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
