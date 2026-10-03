import { extractArticleFromJsonLd, extractJsonLd, extractProductFromJsonLd } from './jsonld.js';
import { extractOpenGraph } from './opengraph.js';
import { extractStandardMeta } from './standard.js';
import { extractTwitterCard } from './twitter.js';
import type { UniversalMetadata } from './types.js';

export * from './types.js';
export { extractJsonLd, extractProductFromJsonLd, extractArticleFromJsonLd } from './jsonld.js';
export { extractOpenGraph } from './opengraph.js';
export { extractTwitterCard } from './twitter.js';
export { extractStandardMeta } from './standard.js';

/**
 * Universal metadata extractor combining JSON-LD, OpenGraph, Twitter Card, and Standard Meta.
 * Resolves properties using an adaptive fallback hierarchy.
 *
 * @param root Document or Element containing head/body markup
 */
export function extractMetadata(root?: any): UniversalMetadata {
  const targetDoc = root || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc) {
    return {
      keywords: [],
      openGraph: {},
      twitterCard: {},
      jsonLd: [],
    };
  }

  const jsonLd = extractJsonLd(targetDoc);
  const openGraph = extractOpenGraph(targetDoc);
  const twitterCard = extractTwitterCard(targetDoc);
  const standard = extractStandardMeta(targetDoc);

  const product = extractProductFromJsonLd(jsonLd);
  const article = extractArticleFromJsonLd(jsonLd);

  // Fallback hierarchy for Title
  const title =
    openGraph.title || twitterCard.title || article?.headline || product?.name || standard.title;

  // Fallback hierarchy for Description
  const description = openGraph.description || twitterCard.description || standard.description;

  // Fallback hierarchy for Image
  const image = openGraph.image || twitterCard.image || product?.images[0] || undefined;

  // Fallback hierarchy for Canonical / URL
  const canonical = standard.canonical || openGraph.url || undefined;
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : undefined);

  // Fallback hierarchy for Author
  const author = article?.author || standard.author || openGraph.author || undefined;

  // Fallback hierarchy for Dates
  const publishedTime =
    article?.datePublished || openGraph['article:published_time'] || standard.publishedTime;

  const modifiedTime =
    article?.dateModified || openGraph['article:modified_time'] || standard.modifiedTime;

  // Site name
  const siteName = openGraph.site_name || article?.publisher || undefined;

  // Aggregate keywords
  const keywordsSet = new Set<string>([...standard.keywords, ...(article?.tags || [])]);

  return {
    title,
    description,
    url,
    canonical,
    image,
    siteName,
    author,
    publishedTime,
    modifiedTime,
    language: standard.language,
    keywords: Array.from(keywordsSet),
    openGraph,
    twitterCard,
    jsonLd,
    product,
    article,
  };
}
