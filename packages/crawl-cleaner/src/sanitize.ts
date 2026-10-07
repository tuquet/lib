import type { SanitizeOptions } from './types.js';

const DISALLOWED_TAGS = [
  'script',
  'style',
  'noscript',
  'svg',
  'iframe',
  'frame',
  'object',
  'embed',
  'canvas',
  'video',
  'audio',
  'track',
  'source',
  'form',
  'input',
  'textarea',
  'select',
  'button',
  'nav',
  'footer',
  'header',
  'aside',
  'dialog',
  'menu',
];

const DISALLOWED_SELECTORS = [
  '[aria-hidden="true"]',
  '[hidden]',
  '.hidden',
  '.sr-only',
  '.ads',
  '.ad',
  '.social-share',
  '.comments',
  '#comments',
  '.cookie-banner',
  '#cookie-banner',
];

/**
 * Strips script tags, styles, media placeholders, ads, and inline attributes
 * to produce a clean DOM container suitable for conversion.
 */
export function sanitizeDom(root: Element, options: SanitizeOptions = {}): Element {
  const clone = root.cloneNode(true) as Element;

  // 1. Remove disallowed tags
  for (const tag of DISALLOWED_TAGS) {
    clone.querySelectorAll(tag).forEach((el: any) => el.remove());
  }

  // 2. Remove disallowed selectors
  const selectors = [...DISALLOWED_SELECTORS, ...(options.customRemoveSelectors || [])];
  for (const sel of selectors) {
    try {
      clone.querySelectorAll(sel).forEach((el: any) => el.remove());
    } catch {
      // Ignore invalid selectors
    }
  }

  if (options.removeImages) {
    clone.querySelectorAll('img, picture').forEach((el: any) => el.remove());
  }

  // 3. Strip useless attributes from all elements
  const allElements = clone.querySelectorAll('*');
  for (const el of Array.from(allElements) as any[]) {
    // Retain only functional semantic attributes
    const allowedAttrs = new Set(['href', 'src', 'alt', 'title', 'datetime', 'colspan', 'rowspan']);
    const attrNames = Array.from(el.attributes || []).map((a: any) => a.name);

    for (const name of attrNames) {
      if (!allowedAttrs.has(name.toLowerCase())) {
        el.removeAttribute(name);
      }
    }
  }

  return clone;
}
