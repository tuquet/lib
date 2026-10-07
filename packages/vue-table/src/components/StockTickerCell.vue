<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
import { useCellFlash } from '../composables/useCellFlash.js';

export interface StockTickerCellProps {
  /**
   * Current numeric value (price, change, volume, etc.)
   */
  value: number;
  /**
   * Reference / previous close price (used to determine up/down/ref color)
   */
  referencePrice?: number;
  /**
   * Ceiling price (HOSE +7%, HNX +10%, UPCoM +15%)
   */
  ceilingPrice?: number;
  /**
   * Floor price (HOSE -7%, HNX -10%, UPCoM -15%)
   */
  floorPrice?: number;
  /**
   * Whether to show an up/down arrow indicator icon
   */
  showArrow?: boolean;
  /**
   * Flash duration in ms
   */
  flashDurationMs?: number;
  /**
   * Decimal places for formatting numbers. Default: 2
   */
  decimalPlaces?: number;
  /**
   * Custom value formatter function
   */
  formatter?: (val: number) => string;
  /**
   * Text alignment: 'left' | 'center' | 'right'. Default: 'right'
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Show +/- sign prefix for changes
   */
  showSign?: boolean;
}

const props = withDefaults(defineProps<StockTickerCellProps>(), {
  referencePrice: undefined,
  ceilingPrice: undefined,
  floorPrice: undefined,
  showArrow: false,
  flashDurationMs: 450,
  decimalPlaces: 2,
  formatter: undefined,
  align: 'right',
  showSign: false,
});

const { flashClass, flashDirection } = useCellFlash(() => props.value, {
  durationMs: props.flashDurationMs,
});

const formattedValue = computed(() => {
  if (props.formatter) {
    return props.formatter(props.value);
  }
  if (props.value === undefined || props.value === null || isNaN(props.value)) return '-';

  const sign = props.showSign && props.value > 0 ? '+' : '';
  return sign + props.value.toLocaleString('vi-VN', {
    minimumFractionDigits: props.decimalPlaces,
    maximumFractionDigits: props.decimalPlaces,
  });
});

const marketColorClass = computed(() => {
  if (
    props.referencePrice === undefined ||
    props.value === undefined ||
    props.value === null ||
    isNaN(props.value)
  ) {
    return 'text-foreground';
  }

  // Ceiling Check (Tím trần)
  if (props.ceilingPrice !== undefined && props.value >= props.ceilingPrice - 0.01) {
    return 'text-fuchsia-600 dark:text-fuchsia-400 font-bold';
  }

  // Floor Check (Xanh lơ sàn)
  if (props.floorPrice !== undefined && props.value <= props.floorPrice + 0.01) {
    return 'text-cyan-600 dark:text-cyan-400 font-bold';
  }

  // Uptick vs Ref (Xanh lá)
  if (props.value > props.referencePrice) {
    return 'text-emerald-600 dark:text-emerald-400 font-medium';
  }

  // Downtick vs Ref (Đỏ)
  if (props.value < props.referencePrice) {
    return 'text-rose-600 dark:text-rose-400 font-medium';
  }

  // Reference Price (Vàng tham chiếu)
  return 'text-amber-600 dark:text-amber-400 font-medium';
});

const alignClass = computed(() => {
  if (props.align === 'left') return 'justify-start text-left';
  if (props.align === 'center') return 'justify-center text-center';
  return 'justify-end text-right';
});
</script>

<template>
  <div
    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-xs transition-colors duration-400 select-none w-full"
    :class="[alignClass, flashClass ? flashClass : marketColorClass]"
  >
    <ArrowUp
      v-if="showArrow && (flashDirection === 'up' || (referencePrice !== undefined && value > referencePrice))"
      class="h-3 w-3 shrink-0 text-emerald-500 animate-in fade-in zoom-in duration-200"
    />
    <ArrowDown
      v-else-if="showArrow && (flashDirection === 'down' || (referencePrice !== undefined && value < referencePrice))"
      class="h-3 w-3 shrink-0 text-rose-500 animate-in fade-in zoom-in duration-200"
    />
    <span class="truncate">
      {{ formattedValue }}
    </span>
  </div>
</template>
