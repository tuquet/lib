import type { IdleOptions } from './types.js';

/**
 * Waits until DOM mutations subside for a specified quietness threshold,
 * indicating AJAX hydration or rendering has stabilized.
 */
export function waitForDomIdle(options: IdleOptions = {}): Promise<void> {
  const quietnessMs = options.quietnessThresholdMs ?? 500;
  const maxTimeoutMs = options.maxTimeoutMs ?? 5000;

  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId: any = null;
    let maxTimeoutId: any = null;

    const cleanup = () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
      if (maxTimeoutId) clearTimeout(maxTimeoutId);
    };

    const onQuiet = () => {
      cleanup();
      resolve();
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(onQuiet, quietnessMs);
    };

    const observer = new MutationObserver(() => {
      resetTimer();
    });

    try {
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    } catch {
      resolve();
      return;
    }

    // Start initial timer
    resetTimer();

    // Absolute deadline
    maxTimeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, maxTimeoutMs);
  });
}
