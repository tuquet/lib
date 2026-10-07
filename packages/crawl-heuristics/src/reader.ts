import { scoreNode } from './scoring.js';
import type { ExtractedArticle, NodeScore } from './types.js';

/**
 * Discovers and extracts the main article body and metadata from arbitrary DOM documents
 * using text-density algorithms.
 */
export function extractMainContent(root?: Document | Element | any): ExtractedArticle {
  const doc = root || (typeof document !== 'undefined' ? document : null);
  if (!doc) {
    return {
      title: '',
      contentHtml: '',
      text: '',
      excerpt: '',
      wordCount: 0,
      readingTimeMinutes: 0,
      confidenceScore: 0,
    };
  }

  // 1. Resolve Best Title
  const title =
    doc.querySelector('h1')?.textContent?.trim() ||
    doc.querySelector('title')?.textContent?.trim() ||
    '';

  // 2. Discover Candidates
  const candidates: Element[] = Array.from(
    doc.querySelectorAll('article, main, div, section, [role="main"]')
  );

  let bestCandidate: NodeScore = {
    element: doc.body || doc,
    contentScore: 0,
    linkDensity: 0,
    textLength: 0,
  };

  for (const el of candidates) {
    const score = scoreNode(el);
    if (score.contentScore > bestCandidate.contentScore) {
      bestCandidate = score;
    }
  }

  // If no high-scoring candidate was found, fallback to doc.body
  const container = bestCandidate.contentScore > 15 ? bestCandidate.element : doc.body || doc;

  // Clean container clone
  const cloned = container.cloneNode(true) as Element;

  // Strip obvious noise elements
  cloned
    .querySelectorAll(
      'script, style, noscript, svg, iframe, nav, footer, header, aside, .ad, .ads, .social-share, .related-posts, .comments, #comments'
    )
    .forEach((el: any) => el.remove());

  const text = (cloned.textContent || '').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Extract lead excerpt
  const firstParagraph = cloned.querySelector('p')?.textContent?.trim() || '';
  const excerpt = firstParagraph ? firstParagraph.slice(0, 240) : text.slice(0, 240);

  // Author byline discovery
  const bylineEl = doc.querySelector('[rel="author"], .author, .byline, [itemprop="author"]');
  const byline = bylineEl?.textContent?.trim() || undefined;

  const confidenceScore = Math.min(100, Math.round((bestCandidate.contentScore / 100) * 100));

  return {
    title,
    contentHtml: cloned.innerHTML,
    text,
    excerpt,
    wordCount: words,
    readingTimeMinutes,
    byline,
    confidenceScore: Math.max(10, confidenceScore),
  };
}
