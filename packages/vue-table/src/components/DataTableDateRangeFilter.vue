<script setup lang="ts">
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RangeCalendar,
  endOfMonth,
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  today,
  type DateRange,
  type DateValue,
} from '@tuquet/vue-ui';
import { Calendar as CalendarIcon, X } from 'lucide-vue-next';
import { computed, ref, shallowRef, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useTableLocale } from '../locale/index.js';

export interface DateRangeValue {
  start?: string;
  end?: string;
}

export interface DateRangePreset {
  label: string;
  getRange: () => { start: string; end: string };
}

export interface DataTableDateRangeFilterProps {
  title?: string;
  modelValue?: DateRangeValue | [string, string] | null;
  placeholder?: string;
  presets?: DateRangePreset[];
  numberOfMonths?: number;
}

const props = withDefaults(defineProps<DataTableDateRangeFilterProps>(), {
  title: undefined,
  modelValue: undefined,
  placeholder: undefined,
  numberOfMonths: 2,
});

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeValue | undefined];
  change: [value: DateRangeValue | undefined];
}>();

const locale = useTableLocale();
const dateMsgs = computed(() => locale.value.messages.dateRange);

const effectiveTitle = computed(() => props.title ?? dateMsgs.value?.title ?? 'Date');
const effectivePlaceholder = computed(() => props.placeholder ?? dateMsgs.value?.placeholder ?? 'Select date range');

const isMobile = useMediaQuery('(max-width: 640px)');
const effectiveNumberOfMonths = computed(() => (isMobile.value ? 1 : props.numberOfMonths));

const isOpen = ref(false);

const defaultPresets = computed<DateRangePreset[]>(() => {
  const m = dateMsgs.value;
  return [
    {
      label: m?.today ?? 'Today',
      getRange: () => {
        const t = today(getLocalTimeZone());
        const s = t.toString();
        return { start: s, end: s };
      },
    },
    {
      label: m?.yesterday ?? 'Yesterday',
      getRange: () => {
        const t = today(getLocalTimeZone()).subtract({ days: 1 });
        const s = t.toString();
        return { start: s, end: s };
      },
    },
    {
      label: m?.last7Days ?? 'Last 7 days',
      getRange: () => {
        const t = today(getLocalTimeZone());
        return {
          start: t.subtract({ days: 6 }).toString(),
          end: t.toString(),
        };
      },
    },
    {
      label: m?.last30Days ?? 'Last 30 days',
      getRange: () => {
        const t = today(getLocalTimeZone());
        return {
          start: t.subtract({ days: 29 }).toString(),
          end: t.toString(),
        };
      },
    },
    {
      label: m?.thisMonth ?? 'This month',
      getRange: () => {
        const t = today(getLocalTimeZone());
        return {
          start: startOfMonth(t).toString(),
          end: endOfMonth(t).toString(),
        };
      },
    },
    {
      label: m?.lastMonth ?? 'Last month',
      getRange: () => {
        const lm = today(getLocalTimeZone()).subtract({ months: 1 });
        return {
          start: startOfMonth(lm).toString(),
          end: endOfMonth(lm).toString(),
        };
      },
    },
  ];
});

const activePresets = computed(() => props.presets ?? defaultPresets.value);

// Internal calendar value binding
const calendarValue = shallowRef<DateRange>({
  start: undefined,
  end: undefined,
});

// Helper to parse input modelValue to DateValue
function parseToDateValue(dateStr?: string): DateValue | undefined {
  if (!dateStr) return undefined;
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return parseDate(cleanStr);
  } catch {
    return undefined;
  }
}

// Sync modelValue -> calendarValue
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      calendarValue.value = { start: undefined, end: undefined };
      return;
    }
    if (Array.isArray(val)) {
      calendarValue.value = {
        start: parseToDateValue(val[0]),
        end: parseToDateValue(val[1]),
      };
    } else {
      calendarValue.value = {
        start: parseToDateValue(val.start),
        end: parseToDateValue(val.end),
      };
    }
  },
  { immediate: true, deep: true }
);

const hasValue = computed(() => {
  return !!(calendarValue.value.start && calendarValue.value.end);
});

// Format display text on trigger button
const displayText = computed(() => {
  const { start, end } = calendarValue.value;
  if (!start) return null;
  if (!end) return start.toString();
  if (start.toString() === end.toString()) {
    return start.toString();
  }
  return `${start.toString()} - ${end.toString()}`;
});

function emitChange(val: DateRangeValue | undefined) {
  emit('update:modelValue', val);
  emit('change', val);
}

function handleClear(e?: Event) {
  e?.stopPropagation();
  calendarValue.value = { start: undefined, end: undefined };
  emitChange(undefined);
  isOpen.value = false;
}

function applyPreset(preset: DateRangePreset) {
  const range = preset.getRange();
  calendarValue.value = {
    start: parseToDateValue(range.start),
    end: parseToDateValue(range.end),
  };
  emitChange(range);
  isOpen.value = false;
}

function handleApply() {
  if (calendarValue.value.start && calendarValue.value.end) {
    emitChange({
      start: calendarValue.value.start.toString(),
      end: calendarValue.value.end.toString(),
    });
  } else if (calendarValue.value.start && !calendarValue.value.end) {
    emitChange({
      start: calendarValue.value.start.toString(),
      end: calendarValue.value.start.toString(),
    });
  } else {
    emitChange(undefined);
  }
  isOpen.value = false;
}

function isPresetActive(preset: DateRangePreset): boolean {
  if (!calendarValue.value.start || !calendarValue.value.end) return false;
  const currentStart = calendarValue.value.start.toString();
  const currentEnd = calendarValue.value.end.toString();
  const range = preset.getRange();
  return currentStart === range.start && currentEnd === range.end;
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-8 border-dashed text-xs gap-1.5"
        :class="{ 'border-primary/50 bg-accent/40 font-medium': hasValue }"
      >
        <CalendarIcon class="h-3.5 w-3.5 text-muted-foreground" />
        <span class="text-muted-foreground">{{ effectiveTitle }}:</span>
        <span v-if="displayText" class="text-foreground font-medium">{{ displayText }}</span>
        <span v-else class="text-muted-foreground">{{ effectivePlaceholder }}</span>

        <button
          v-if="hasValue"
          type="button"
          :aria-label="dateMsgs?.clear ?? 'Clear'"
          class="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          @click.stop="handleClear"
        >
          <X class="h-3 w-3" />
        </button>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <div class="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
        <!-- Presets Column -->
        <div class="p-2 flex flex-col gap-0.5 min-w-[130px]">
          <div class="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
            {{ dateMsgs?.presetsTitle ?? 'Shortcuts' }}
          </div>
          <Button
            v-for="preset in activePresets"
            :key="preset.label"
            variant="ghost"
            size="sm"
            class="justify-start text-xs font-normal h-7 px-2"
            :class="{ 'bg-accent font-medium text-accent-foreground': isPresetActive(preset) }"
            @click="applyPreset(preset)"
          >
            {{ preset.label }}
          </Button>
        </div>

        <!-- Range Calendar Column -->
        <div class="p-2">
          <RangeCalendar
            v-model="calendarValue"
            :number-of-months="effectiveNumberOfMonths"
            initial-focus
          />
          <div class="flex items-center justify-between border-t pt-2 mt-2 px-1">
            <Button
              variant="ghost"
              size="sm"
              class="text-xs h-7 px-2"
              @click="handleClear"
            >
              {{ dateMsgs?.clear ?? 'Clear' }}
            </Button>
            <Button
              size="sm"
              class="text-xs h-7 px-3"
              :disabled="!calendarValue.start"
              @click="handleApply"
            >
              {{ dateMsgs?.apply ?? 'Apply' }}
            </Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
