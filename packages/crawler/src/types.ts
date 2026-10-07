import type { ExtractedArticle, PageType } from '@tuquet/crawl-heuristics';
import type { UniversalMetadata } from '@tuquet/crawl-metadata';

export interface CrawlPipelineOptions {
  /** Automatically dismiss cookie/GDPR banners and modals (default: true) */
  autoDismissModals?: boolean;
  /** Automatically perform smooth scrolling to trigger lazy loading (default: false) */
  autoScroll?: boolean;
  /** Maximum scroll steps if autoScroll is enabled (default: 10) */
  scrollMaxSteps?: number;
  /** Wait for DOM mutation quietness (default: false) */
  waitForIdle?: boolean;
  /** Extract Schema.org JSON-LD and OpenGraph metadata (default: true) */
  extractMetadata?: boolean;
  /** Extract clean article body using heuristics (default: true) */
  extractMainContent?: boolean;
  /** Convert DOM to clean Markdown (default: true) */
  toMarkdown?: boolean;
  /** Base URL for relative link resolution */
  baseUrl?: string;
}

export interface CrawlResult {
  /** Page URL */
  url?: string;
  /** Classified page type */
  pageType: PageType;
  /** Resolved structured metadata */
  metadata?: UniversalMetadata;
  /** Extracted primary article / reader content */
  article?: ExtractedArticle;
  /** Clean GitHub Flavored Markdown */
  markdown?: string;
  /** Processing duration in milliseconds */
  elapsedMs: number;
}
