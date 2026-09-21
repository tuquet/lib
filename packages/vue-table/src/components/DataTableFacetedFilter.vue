<script setup lang="ts">
import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from '@tuquet/vue-ui';
import { Check, PlusCircle } from 'lucide-vue-next';
import { computed } from 'vue';
import type { FacetedFilterOption } from '../types/index.js';
import { useTableLocale } from '../locale/index.js';

export interface DataTableFacetedFilterProps {
  title?: string;
  options: FacetedFilterOption[];
  modelValue?: (string | number)[];
}

const props = withDefaults(defineProps<DataTableFacetedFilterProps>(), {
  title: 'Filter',
  modelValue: () => [],
});

const locale = useTableLocale();
const emptyMessage = computed(() => locale.value.messages.general.emptyMessage);
const clearAllText = computed(() => locale.value.messages.filterBuilder.clearAll || 'Clear filters');
const selectedText = computed(() => (locale.value.code.startsWith('vi') ? 'đã chọn' : 'selected'));

const emit = defineEmits<{
  (e: 'update:modelValue', value: (string | number)[]): void;
}>();

const selectedValues = computed(() => new Set<string | number>(props.modelValue ?? []));

const toggleOption = (val: string | number) => {
  const newSet = new Set<string | number>(selectedValues.value);
  if (newSet.has(val)) {
    newSet.delete(val);
  } else {
    newSet.add(val);
  }
  emit('update:modelValue', Array.from(newSet));
};

const clearFilters = () => {
  emit('update:modelValue', []);
};
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 border-dashed">
        <PlusCircle class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ selectedValues.size }}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            <Badge
              v-if="selectedValues.size > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedValues.size }} {{ selectedText }}
            </Badge>
            <template v-else>
              <Badge
                v-for="option in options.filter((opt) => selectedValues.has(opt.value))"
                :key="option.value"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ option.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command>
        <CommandInput :placeholder="title" />
        <CommandList>
          <CommandEmpty>{{ emptyMessage }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option.label"
              @select="() => toggleOption(option.value)"
            >
              <div
                :class="[
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                ]"
              >
                <Check class="h-4 w-4" />
              </div>
              <component
                :is="option.icon"
                v-if="option.icon"
                class="mr-2 h-4 w-4 text-muted-foreground"
              />
              <span>{{ option.label }}</span>
              <span
                v-if="option.count !== undefined"
                class="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs"
              >
                {{ option.count }}
              </span>
            </CommandItem>
          </CommandGroup>
          <template v-if="selectedValues.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="clear"
                class="justify-center text-center font-medium"
                @select="clearFilters"
              >
                {{ clearAllText }}
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
