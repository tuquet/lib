import type { PageType } from './types.js';

/**
 * Heuristically classifies the page type based on structural signatures
 */
export function detectPageType(root?: Document | Element | any): PageType {
  const doc = root || (typeof document !== 'undefined' ? document : null);
  if (!doc) return 'unknown';

  const title = (doc.querySelector('title')?.textContent || '').toLowerCase();
  const text = (doc.body?.textContent || '').toLowerCase();

  // 1. Error Page Detection
  if (
    title.includes('404') ||
    title.includes('not found') ||
    title.includes('page not found') ||
    title.includes('error') ||
    title.includes('500') ||
    title.includes('access denied') ||
    text.includes('404 not found')
  ) {
    return 'error';
  }

  // 2. Product Page Detection
  const hasCartBtn = !!doc.querySelector(
    'button[id*="cart" i], button[class*="cart" i], [data-testid*="buy" i], .add-to-cart, #add-to-cart'
  );
  const hasPrice = !!doc.querySelector('[class*="price" i], [id*="price" i], [itemprop="price"]');
  const hasProductSchema = !!doc.querySelector(
    'script[type="application/ld+json"]:is(:contains("Product"))'
  );

  if ((hasCartBtn && hasPrice) || hasProductSchema) {
    return 'product';
  }

  // 3. Article / Blog Post Detection
  const articleTags = doc.querySelectorAll('article');
  const paragraphs = doc.querySelectorAll('article p, main p, .post-content p');
  const hasTime = !!doc.querySelector('time[datetime], meta[property="article:published_time"]');

  if ((articleTags.length === 1 && paragraphs.length >= 3) || (hasTime && paragraphs.length >= 4)) {
    return 'article';
  }

  // 4. Listing / Search / Catalog Page Detection
  const productCards = doc.querySelectorAll(
    '.product-card, .item-card, [class*="product-item" i], [class*="listing-item" i]'
  );
  if (productCards.length >= 4) {
    return 'listing';
  }

  // 5. Homepage Detection
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname === '/' || pathname === '/index.html' || pathname === '') {
      return 'homepage';
    }
  }

  return 'unknown';
}
