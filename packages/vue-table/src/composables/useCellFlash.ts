import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue';

export type FlashDirection = 'up' | 'down' | 'neutral' | 'none';

export interface UseCellFlashOptions {
  /**
   * Duration of the flash effect in milliseconds before decaying back to normal.
   * Default: 450ms
   */
  durationMs?: number;
  /**
   * CSS class applied on uptick (value increased).
   * Default: 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400'
   */
  upClass?: string;
  /**
   * CSS class applied on downtick (value decreased).
   * Default: 'bg-rose-500/25 text-rose-600 dark:text-rose-400'
   */
  downClass?: string;
  /**
   * Minimum absolute difference required to trigger a flash.
   * Default: 0 (any change triggers flash)
   */
  threshold?: number;
}

export interface UseCellFlashReturn {
  /**
   * Current active CSS class to bind to the element.
   */
  flashClass: Ref<string>;
  /**
   * Current direction of the last flash: 'up' | 'down' | 'none'
   */
  flashDirection: Ref<FlashDirection>;
  /**
   * Manually trigger a flash effect
   */
  triggerFlash: (direction: 'up' | 'down') => void;
  /**
   * Clears any active flash immediately
   */
  clearFlash: () => void;
}

export function useCellFlash(
  valueSource: () => number | undefined | null,
  options: UseCellFlashOptions = {}
): UseCellFlashReturn {
  const {
    durationMs = 450,
    upClass = 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold',
    downClass = 'bg-rose-500/25 text-rose-700 dark:text-rose-300 font-semibold',
    threshold = 0,
  } = options;

  const flashClass = ref('');
  const flashDirection = ref<FlashDirection>('none');
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function clearFlash() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    flashClass.value = '';
    flashDirection.value = 'none';
  }

  function triggerFlash(direction: 'up' | 'down') {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    flashDirection.value = direction;
    flashClass.value = direction === 'up' ? upClass : downClass;

    timeoutId = setTimeout(() => {
      flashClass.value = '';
      flashDirection.value = 'none';
      timeoutId = null;
    }, durationMs);
  }

  watch(
    valueSource,
    (newVal, oldVal) => {
      if (newVal === undefined || newVal === null || oldVal === undefined || oldVal === null) {
        return;
      }
      const diff = newVal - oldVal;
      if (Math.abs(diff) <= threshold) return;

      if (diff > 0) {
        triggerFlash('up');
      } else if (diff < 0) {
        triggerFlash('down');
      }
    },
    { flush: 'post' }
  );

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearFlash();
    });
  }

  return {
    flashClass,
    flashDirection,
    triggerFlash,
    clearFlash,
  };
}
