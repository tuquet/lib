import type { ExpanderOptions } from './types.js';

const DEFAULT_EXPANDER_KEYWORDS = [
  'read more',
  'show more',
  'load more',
  'view more',
  'see more',
  'xem thêm',
  'đọc tiếp',
  'tải thêm',
  'mở rộng',
  'mehr anzeigen',
  'weiterlesen',
  'lire plus',
  'ver más',
];

/**
 * Automatically discovers and clicks collapsed content expander buttons
 * (e.g. "Read more", "Xem thêm", "Show more").
 */
export function clickContentExpanders(options: ExpanderOptions = {}): number {
  const root = options.root || (typeof document !== 'undefined' ? document : null);
  if (!root) return 0;

  const maxClicks = options.maxClicks ?? 3;
  const keywords = [...DEFAULT_EXPANDER_KEYWORDS, ...(options.customKeywords || [])].map((k) =>
    k.toLowerCase()
  );

  let clicks = 0;
  const buttons = Array.from(
    root.querySelectorAll('button, a[role="button"], [role="button"], span.read-more, .expand-btn')
  );

  for (const btn of buttons as any[]) {
    if (clicks >= maxClicks) break;
    const text = (btn.textContent || btn.innerText || '').trim().toLowerCase();
    if (!text || text.length > 30) continue;

    const matches = keywords.some((kw) => text === kw || text.includes(kw));
    if (matches) {
      try {
        btn.click();
        clicks++;
      } catch {
        // Ignore failure
      }
    }
  }

  return clicks;
}
