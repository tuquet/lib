<script setup lang="ts">
import { Button } from '@tuquet/vue-ui';
import { Check, Copy } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface CopyableCellProps {
  value: string;
  displayText?: string;
  truncateLength?: number;
}

const props = defineProps<CopyableCellProps>();

const locale = useTableLocale();
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
});

const textToShow = computed(() => {
  const base = props.displayText ?? props.value ?? '';
  if (props.truncateLength && base.length > props.truncateLength) {
    return `${base.slice(0, props.truncateLength)}…`;
  }
  return base;
});

async function copyToClipboard(e: MouseEvent) {
  e.stopPropagation();
  if (!props.value) return;

  try {
    await navigator.clipboard.writeText(props.value);
    copied.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
}
</script>

<template>
  <div class="inline-flex items-center gap-1.5 font-mono text-xs">
    <span :title="value" class="truncate">{{ textToShow }}</span>
    <Button
      variant="ghost"
      size="icon"
      class="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
      :title="copied ? (locale.messages.cell.copied || 'Copied!') : (locale.messages.cell.copy || 'Copy to clipboard')"
      @click="copyToClipboard"
    >
      <Check v-if="copied" class="h-3 w-3 text-green-500" />
      <Copy v-else class="h-3 w-3" />
      <span class="sr-only">{{ locale.messages.cell.copy || 'Copy' }}</span>
    </Button>
  </div>
</template>
