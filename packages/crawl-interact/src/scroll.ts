import type { ScrollOptions, ScrollResult } from './types.js';

/**
 * Performs progressive scrolling to trigger IntersectionObserver, lazy-loaded images,
 * and dynamic pagination scripts without triggering abrupt anti-bot bot flags.
 */
export async function smoothScroll(options: ScrollOptions = {}): Promise<ScrollResult> {
  const startTime = Date.now();
  const stepPx = options.stepPx ?? 400;
  const delayMs = options.delayMs ?? 100;
  const maxSteps = options.maxSteps ?? 20;
  const scrollBackToTop = options.scrollBackToTop ?? true;

  if (typeof window === 'undefined') {
    return {
      stepsExecuted: 0,
      scrollHeight: 0,
      elapsedMs: 0,
    };
  }

  let stepsExecuted = 0;
  let previousHeight = 0;
  let consecutiveStagnantSteps = 0;

  while (stepsExecuted < maxSteps) {
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );

    window.scrollBy({
      top: stepPx,
      left: 0,
      behavior: 'smooth',
    });

    stepsExecuted++;

    // Wait for repaint and dynamic content hydration
    await sleep(delayMs);

    const newScroll = window.scrollY || window.pageYOffset || 0;
    if (newScroll === currentScroll || documentHeight === previousHeight) {
      consecutiveStagnantSteps++;
      if (consecutiveStagnantSteps >= 3) {
        // Reached bottom of page
        break;
      }
    } else {
      consecutiveStagnantSteps = 0;
    }

    previousHeight = documentHeight;
  }

  const finalHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

  if (scrollBackToTop) {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
    await sleep(delayMs);
  }

  return {
    stepsExecuted,
    scrollHeight: finalHeight,
    elapsedMs: Date.now() - startTime,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
