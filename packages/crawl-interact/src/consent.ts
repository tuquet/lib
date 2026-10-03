import type { DismissOptions } from './types.js';

/**
 * Multilingual keywords commonly present on consent, accept, and close buttons
 */
const DEFAULT_CONSENT_KEYWORDS = [
  'accept all',
  'accept cookies',
  'accept',
  'agree',
  'allow all',
  'allow',
  'i agree',
  'i accept',
  'got it',
  'understand',
  'chấp nhận',
  'đồng ý',
  'tôi đồng ý',
  'cho phép',
  'akzeptieren',
  'zustimmen',
  'accepter',
  'acepto',
  'accetta',
  'đóng',
  'dismiss',
  'close',
];

const DEFAULT_POPUP_SELECTORS = [
  'button[id*="cookie" i]',
  'button[class*="cookie" i]',
  'button[id*="consent" i]',
  'button[class*="consent" i]',
  'button[id*="accept" i]',
  'button[class*="accept" i]',
  'button[data-testid*="cookie" i]',
  'button[data-testid*="consent" i]',
  'button[data-testid*="close" i]',
  'button[aria-label*="close" i]',
  'button[aria-label*="dismiss" i]',
  'button[aria-label*="accept" i]',
  '.modal button.close',
  '.popup-close',
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
];

/**
 * Automatically discovers and clicks cookie consent, GDPR, and popup dismiss buttons
 *
 * @returns Number of buttons successfully clicked
 */
export function dismissConsentModals(options: DismissOptions = {}): number {
  const root = options.root || (typeof document !== 'undefined' ? document : null);
  if (!root) return 0;

  const maxClicks = options.maxClicks ?? 5;
  const keywords = [...DEFAULT_CONSENT_KEYWORDS, ...(options.customKeywords || [])].map((k) =>
    k.toLowerCase()
  );
  const selectors = [...DEFAULT_POPUP_SELECTORS, ...(options.customSelectors || [])];

  let clickedCount = 0;
  const clickedElements = new Set<any>();

  // Strategy 1: Targeted Selector Query
  for (const selector of selectors) {
    if (clickedCount >= maxClicks) break;
    try {
      const elements = Array.from(root.querySelectorAll(selector));
      for (const el of elements as any[]) {
        if (clickedCount >= maxClicks) break;
        if (!clickedElements.has(el) && isClickable(el)) {
          clickElement(el);
          clickedElements.add(el);
          clickedCount++;
        }
      }
    } catch {
      // Ignore invalid CSS selector
    }
  }

  // Strategy 2: Text Matching on Buttons & Clickable Elements
  if (clickedCount < maxClicks) {
    const candidateNodes = Array.from(
      root.querySelectorAll(
        'button, a[role="button"], [role="button"], input[type="button"], input[type="submit"]'
      )
    );

    for (const node of candidateNodes as any[]) {
      if (clickedCount >= maxClicks) break;
      if (clickedElements.has(node)) continue;

      const text = (node.textContent || node.value || node.getAttribute('aria-label') || '')
        .trim()
        .toLowerCase();
      if (!text || text.length > 50) continue; // Avoid clicking large paragraphs

      const matches = keywords.some((kw) => text === kw || text.includes(kw));
      if (matches && isClickable(node)) {
        clickElement(node);
        clickedElements.add(node);
        clickedCount++;
      }
    }
  }

  return clickedCount;
}

function isClickable(el: any): boolean {
  if (!el) return false;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
  if (el.style) {
    if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
  }
  return true;
}

function clickElement(el: any): void {
  try {
    if (typeof el.click === 'function') {
      el.click();
    } else {
      el.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    }
  } catch {
    // Ignore click dispatch failure
  }
}
