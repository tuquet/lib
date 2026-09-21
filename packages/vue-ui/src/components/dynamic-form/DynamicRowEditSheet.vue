<script setup lang="ts">
import { computed, ref, watch, useSlots, onScopeDispose, type Slots } from 'vue';
import type {
  FieldOverridesMap,
  NormalizedFieldDefinition,
  OpenAPISchema,
} from '@/schema/types.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import DynamicForm from './DynamicForm.vue';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3, ArrowLeft } from 'lucide-vue-next';

const slots: Slots = useSlots();
const availableSlotNames = computed<string[]>(() => Object.keys(slots));

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    schema?: OpenAPISchema;
    fields?: NormalizedFieldDefinition[];
    row?: Record<string, any> | null;
    fieldOverrides?: FieldOverridesMap;

    submitText?: string;
    cancelText?: string;
    validationMessages?: Partial<import('@/schema/validator.js').ValidationMessageTemplates>;
    /**
     * Bật tính năng tích hợp nút Back trình duyệt / cử chỉ Back OS (Android/iOS)
     */
    enableBackNavigation?: boolean;
    /**
     * Bật cử chỉ vuốt từ mép trái sang phải để đóng sheet trên điện thoại
     */
    enableSwipeToClose?: boolean;
  }>(),
  {
    title: 'Chỉnh sửa bản ghi',
    description: 'Chỉnh sửa và cập nhật dữ liệu hàng chi tiết.',
    schema: undefined,
    fields: undefined,
    row: null,
    fieldOverrides: () => ({}),
    submitText: 'Lưu thay đổi',
    cancelText: 'Hủy',
    enableBackNavigation: true,
    enableSwipeToClose: true,
  }
);


const emit = defineEmits<{
  'update:open': [open: boolean];
  save: [updatedValues: Record<string, any>, row: Record<string, any>];
  cancel: [];
}>();

const formValues = ref<Record<string, any>>({});
const isDirty = ref(false);
const changedCount = ref(0);
const formRef = ref<any>(null);

// =========================================================================
// 1. Mobile Hardware / Browser History Back Navigation (Android & iOS)
// =========================================================================
let isBackNavigation = false;
let historyPushed = false;

function handlePopState() {
  if (props.open) {
    isBackNavigation = true;
    emit('update:open', false);
    emit('cancel');
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof window === 'undefined' || !props.enableBackNavigation) return;
    if (isOpen) {
      if (!historyPushed) {
        window.history.pushState({ tuquetSheetOpen: true }, '');
        historyPushed = true;
        window.addEventListener('popstate', handlePopState);
      }
    } else {
      window.removeEventListener('popstate', handlePopState);
      if (historyPushed && !isBackNavigation) {
        historyPushed = false;
        window.history.back();
      }
      isBackNavigation = false;
      historyPushed = false;
    }
  }
);

onScopeDispose(() => {
  if (typeof window !== 'undefined' && props.enableBackNavigation) {
    window.removeEventListener('popstate', handlePopState);
    if (historyPushed && !isBackNavigation) {
      window.history.back();
    }
  }
});

// =========================================================================
// 2. Mobile Touch Swipe-to-Back Gesture (Vuốt từ mép trái sang phải để đóng)
// =========================================================================
const touchStartX = ref(0);
const touchStartY = ref(0);
const swipeTranslateX = ref(0);
const isSwiping = ref(false);
const hasDeterminedDirection = ref(false);

function onTouchStart(e: TouchEvent) {
  if (!props.enableSwipeToClose) return;
  const touch = e.touches[0];
  if (!touch) return;
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  hasDeterminedDirection.value = false;

  const target = e.target as HTMLElement | null;
  const isHeader = !!target?.closest('header') || !!target?.closest('[data-sheet-header]');
  // Chỉ kích hoạt vuốt nếu bắt đầu từ mép trái (45px đầu) hoặc trên thanh Header
  if (touch.clientX <= 45 || isHeader) {
    isSwiping.value = true;
  } else {
    isSwiping.value = false;
  }
}

function onTouchMove(e: TouchEvent) {
  if (!props.enableSwipeToClose || !isSwiping.value) return;
  const touch = e.touches[0];
  if (!touch) return;
  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = touch.clientY - touchStartY.value;

  if (!hasDeterminedDirection.value) {
    // Nếu cuộn dọc chiếm ưu thế, hủy cử chỉ vuốt để nhường cho cuộn form native
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 6) {
      isSwiping.value = false;
      swipeTranslateX.value = 0;
      return;
    }
    if (Math.abs(deltaX) > 6) {
      hasDeterminedDirection.value = true;
    }
  }

  // Chỉ kéo theo chiều sang phải
  if (deltaX > 0) {
    swipeTranslateX.value = deltaX;
  } else {
    swipeTranslateX.value = 0;
  }
}

function onTouchEnd() {
  if (!props.enableSwipeToClose || !isSwiping.value) return;
  isSwiping.value = false;
  hasDeterminedDirection.value = false;

  // Ngưỡng kéo để đóng: 80px
  if (swipeTranslateX.value > 80) {
    handleCancel();
  }
  swipeTranslateX.value = 0;
}

watch(
  () => props.row,
  (newRow) => {
    if (newRow) {
      formValues.value = { ...newRow };
    } else {
      formValues.value = {};
    }
  },
  { immediate: true, deep: true }
);

function handleOpenChange(val: boolean) {
  emit('update:open', val);
  if (!val) {
    emit('cancel');
  }
}

function handleDirty(dirty: boolean, keys: string[]) {
  isDirty.value = dirty;
  changedCount.value = keys.length;
}

function handleFormSubmit(values: Record<string, any>) {
  if (!props.row) return;
  emit('save', values, props.row);
  emit('update:open', false);
}

function handleCancel() {
  emit('update:open', false);
  emit('cancel');
}

function triggerSave() {
  const result = formRef.value?.validate();
  if (result && !result.isValid) {
    return;
  }
  handleFormSubmit(formValues.value);
}
</script>

<template>
  <Sheet :open="open" @update:open="handleOpenChange">
    <SheetContent
      side="right"
      class="w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full p-0 flex flex-col gap-0 border-l shadow-2xl bg-card transition-transform will-change-transform"
      :style="swipeTranslateX > 0 ? { transform: `translateX(${swipeTranslateX}px)`, transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' } : undefined"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- Sheet Header (Supabase Right Sheet Style) -->
      <SheetHeader
        data-sheet-header
        class="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-border/60 text-left shrink-0 bg-muted/10 pr-12 select-none"
      >
        <div class="flex items-center gap-2">
          <!-- Mobile Back Arrow Button -->
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="sm:hidden h-8 w-8 p-0 -ml-1 text-muted-foreground hover:text-foreground rounded-full shrink-0"
            title="Quay lại"
            aria-label="Quay lại"
            @click="handleCancel"
          >
            <ArrowLeft class="h-4 w-4" />
          </Button>

          <div class="hidden sm:flex p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
            <Edit3 class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <SheetTitle class="text-base font-semibold text-foreground leading-tight truncate">
              {{ title }}
            </SheetTitle>
            <SheetDescription v-if="description" class="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {{ description }}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <!-- Scrollable Form Body -->
      <div class="flex-1 overflow-y-auto px-6 py-5 overscroll-contain">
        <DynamicForm
          ref="formRef"
          v-model="formValues"
          :schema="schema"
          :fields="fields"
          :field-overrides="fieldOverrides"
          :validation-messages="validationMessages"
          :show-submit-button="false"
          :show-cancel-button="false"
          @dirty="handleDirty"
          @submit="handleFormSubmit"
        >
          <!-- Forward all field slots for custom overrides (Tier 5) -->
          <template
            v-for="slotName in availableSlotNames"
            :key="slotName"
            #[slotName]="slotProps"
          >
            <slot :name="slotName" v-bind="slotProps" />
          </template>
        </DynamicForm>
      </div>

      <!-- Sticky Safe-Area Footer -->
      <SheetFooter
        class="sticky bottom-0 z-20 px-6 py-3.5 border-t border-border/60 bg-background/95 backdrop-blur-sm flex flex-row items-center justify-between gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] shrink-0"
      >
        <!-- Change status indicator -->
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span v-if="isDirty" class="inline-flex items-center gap-1 text-primary font-medium truncate">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{{ changedCount }} thay đổi</span>
          </span>
          <span v-else class="text-muted-foreground/70 truncate">Chưa thay đổi</span>
        </div>

        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-9 px-3 text-xs"
            @click="handleCancel"
          >
            <X class="h-3.5 w-3.5 mr-1" />
            <span>{{ cancelText }}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            class="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
            :variant="isDirty ? 'default' : 'secondary'"
            @click="triggerSave"
          >
            <Check class="h-3.5 w-3.5" />
            <span>{{ submitText }}</span>
            <span
              v-if="isDirty"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-background/20"
            >
              {{ changedCount }}
            </span>
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
