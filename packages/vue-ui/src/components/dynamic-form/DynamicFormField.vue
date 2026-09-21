<script setup lang="ts">
import type { NormalizedFieldDefinition } from '@/schema/types.js';
import { AlertCircle, HelpCircle } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    field: NormalizedFieldDefinition;
    error?: string | null;
  }>(),
  {
    error: null,
  }
);
</script>

<template>
  <div
    v-if="!field.hidden"
    class="flex flex-col gap-1.5 w-full"
    :class="{ 'has-error': Boolean(error) }"
  >
    <!-- Field Header: Label, Required mark, Help tooltip -->
    <div class="flex items-center justify-between">
      <label
        :for="`field-${field.key}`"
        class="text-xs font-semibold text-foreground select-none flex items-center gap-1 leading-none"
      >
        <span>{{ field.label }}</span>
        <span v-if="field.required" class="text-destructive text-sm font-bold leading-none">*</span>
      </label>

      <span
        v-if="field.help"
        class="text-[11px] text-muted-foreground flex items-center gap-1 cursor-help"
        :title="field.help"
      >
        <HelpCircle class="h-3 w-3 opacity-60" />
      </span>
    </div>

    <!-- Field Description if present -->
    <p v-if="field.description" class="text-[11px] text-muted-foreground leading-tight">
      {{ field.description }}
    </p>

    <!-- Field Control Slot -->
    <div class="relative w-full">
      <slot />
    </div>

    <!-- Validation Error Message with smooth animation -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform -translate-y-1 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-1 opacity-0"
    >
      <div
        v-if="error"
        class="flex items-center gap-1.5 text-xs font-medium text-destructive mt-0.5"
      >
        <AlertCircle class="h-3.5 w-3.5 shrink-0" />
        <span>{{ error }}</span>
      </div>
    </transition>
  </div>
</template>
