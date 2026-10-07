import type { ArticleMetadata, ProductMetadata } from './types.js';

/**
 * Safely extracts and flattens JSON-LD scripts from a DOM Document or Element
 */
export function extractJsonLd(root: Document | Element | any): Record<string, any>[] {
  const scripts = Array.from(root.querySelectorAll('script[type="application/ld+json"]'));
  const results: Record<string, any>[] = [];

  for (const script of scripts as any[]) {
    const text = (script.textContent || script.innerText || '').trim();
    if (!text) continue;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object') {
            results.push(...flattenJsonLdItem(item));
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        results.push(...flattenJsonLdItem(parsed));
      }
    } catch {
      // Ignore invalid or malformed JSON-LD scripts
    }
  }

  return results;
}

function flattenJsonLdItem(item: Record<string, any>): Record<string, any>[] {
  if (Array.isArray(item['@graph'])) {
    const list: Record<string, any>[] = [];
    for (const sub of item['@graph']) {
      if (sub && typeof sub === 'object') {
        list.push(sub);
      }
    }
    return list;
  }
  return [item];
}

/**
 * Searches for a Schema.org Product in the parsed JSON-LD array
 */
export function extractProductFromJsonLd(
  items: Record<string, any>[]
): ProductMetadata | undefined {
  const productItem = items.find((item) => {
    const type = item['@type'];
    if (typeof type === 'string') return type.toLowerCase() === 'product';
    if (Array.isArray(type))
      return type.some((t) => typeof t === 'string' && t.toLowerCase() === 'product');
    return false;
  });

  if (!productItem) return undefined;

  const offers = productItem.offers || {};
  const offer = Array.isArray(offers) ? offers[0] || {} : offers;

  const images: string[] = [];
  if (typeof productItem.image === 'string') {
    images.push(productItem.image);
  } else if (Array.isArray(productItem.image)) {
    for (const img of productItem.image) {
      if (typeof img === 'string') images.push(img);
      else if (img && typeof img === 'object' && typeof img.url === 'string') images.push(img.url);
    }
  }

  const brand =
    typeof productItem.brand === 'string'
      ? productItem.brand
      : productItem.brand?.name || undefined;

  const aggRating = productItem.aggregateRating || {};

  return {
    name: productItem.name,
    sku: productItem.sku || productItem.productID,
    price: offer.price || offer.lowPrice,
    currency: offer.priceCurrency,
    availability: offer.availability,
    brand,
    ratingValue: aggRating.ratingValue ? Number(aggRating.ratingValue) : undefined,
    reviewCount: aggRating.reviewCount ? Number(aggRating.reviewCount) : undefined,
    images,
  };
}

/**
 * Searches for an Article / NewsArticle in parsed JSON-LD array
 */
export function extractArticleFromJsonLd(
  items: Record<string, any>[]
): ArticleMetadata | undefined {
  const articleItem = items.find((item) => {
    const type = item['@type'];
    const articleTypes = ['article', 'newsarticle', 'blogposting', 'techarticle', 'report'];
    if (typeof type === 'string') return articleTypes.includes(type.toLowerCase());
    if (Array.isArray(type))
      return type.some((t) => typeof t === 'string' && articleTypes.includes(t.toLowerCase()));
    return false;
  });

  if (!articleItem) return undefined;

  const author = Array.isArray(articleItem.author)
    ? articleItem.author
        .map((a: any) => (typeof a === 'string' ? a : a?.name || ''))
        .filter(Boolean)
        .join(', ')
    : typeof articleItem.author === 'string'
      ? articleItem.author
      : articleItem.author?.name || undefined;

  const publisher =
    typeof articleItem.publisher === 'string'
      ? articleItem.publisher
      : articleItem.publisher?.name || undefined;

  const tags: string[] = [];
  if (typeof articleItem.keywords === 'string') {
    tags.push(
      ...articleItem.keywords
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    );
  } else if (Array.isArray(articleItem.keywords)) {
    tags.push(...articleItem.keywords.map((s: any) => String(s).trim()).filter(Boolean));
  }

  return {
    headline: articleItem.headline || articleItem.name,
    author,
    publisher,
    datePublished: articleItem.datePublished,
    dateModified: articleItem.dateModified,
    section: articleItem.articleSection,
    wordCount: articleItem.wordCount ? Number(articleItem.wordCount) : undefined,
    tags,
  };
}
