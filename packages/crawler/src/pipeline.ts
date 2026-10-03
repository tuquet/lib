import { domToMarkdown } from '@tuquet/crawl-cleaner';
import { detectPageType, extractMainContent } from '@tuquet/crawl-heuristics';
import { dismissConsentModals, smoothScroll, waitForDomIdle } from '@tuquet/crawl-interact';
import { extractMetadata } from '@tuquet/crawl-metadata';
import type { CrawlPipelineOptions, CrawlResult } from './types.js';

/**
 * Universal crawling and semantic extraction pipeline.
 * Runs seamlessly in modern browser tabs, extension workers, or JSDOM environments.
 */
export async function crawlDocument(
  root?: Document | Element | any,
  options: CrawlPipelineOptions = {}
): Promise<CrawlResult> {
  const startTime = Date.now();
  const doc = root || (typeof document !== 'undefined' ? document : null);

  const {
    autoDismissModals = true,
    autoScroll = false,
    scrollMaxSteps = 10,
    waitForIdle = false,
    extractMetadata: shouldExtractMeta = true,
    extractMainContent: shouldExtractContent = true,
    toMarkdown = true,
    baseUrl,
  } = options;

  if (!doc) {
    return {
      pageType: 'unknown',
      elapsedMs: 0,
    };
  }

  // 1. Interaction Phase
  if (autoDismissModals) {
    dismissConsentModals({ root: doc });
  }

  if (autoScroll && typeof window !== 'undefined') {
    await smoothScroll({ maxSteps: scrollMaxSteps, scrollBackToTop: true });
  }

  if (waitForIdle && typeof window !== 'undefined') {
    await waitForDomIdle({ quietnessThresholdMs: 300, maxTimeoutMs: 3000 });
  }

  // 2. Metadata Extraction Phase
  const metadata = shouldExtractMeta ? extractMetadata(doc) : undefined;

  // 3. Heuristic Classification & Article Extraction Phase
  const pageType = detectPageType(doc);
  const article = shouldExtractContent ? extractMainContent(doc) : undefined;

  // 4. Clean Markdown Representation
  let markdown: string | undefined;
  if (toMarkdown) {
    const targetEl = doc.body || doc;
    markdown = domToMarkdown(targetEl, {
      baseUrl: baseUrl || metadata?.canonical || metadata?.url,
    });
  }

  const url =
    metadata?.canonical ||
    metadata?.url ||
    (typeof window !== 'undefined' ? window.location.href : undefined);

  return {
    url,
    pageType,
    metadata,
    article,
    markdown,
    elapsedMs: Date.now() - startTime,
  };
}
