export type PageType = 'article' | 'product' | 'listing' | 'homepage' | 'error' | 'unknown';

export interface ExtractedArticle {
  /** Clean title extracted from highest scoring headline */
  title: string;
  /** Purified main content HTML */
  contentHtml: string;
  /** Plain text representation */
  text: string;
  /** Short summary or lead paragraph */
  excerpt: string;
  /** Total approximate word count */
  wordCount: number;
  /** Estimated reading time in minutes */
  readingTimeMinutes: number;
  /** Primary author or byline if discoverable */
  byline?: string;
  /** Quality confidence score (0 to 100) */
  confidenceScore: number;
}

export interface NodeScore {
  element: Element;
  contentScore: number;
  linkDensity: number;
  textLength: number;
}
