/**
 * Standard structured output from crawl-metadata
 */
export interface UniversalMetadata {
  /** Page title resolved with fallback priority: og:title -> twitter:title -> title -> h1 */
  title?: string;
  /** Page description resolved with fallback priority: og:description -> twitter:description -> meta description */
  description?: string;
  /** Canonical or primary URL */
  url?: string;
  /** Canonical representation resolved from link[rel="canonical"] */
  canonical?: string;
  /** Featured image URL */
  image?: string;
  /** Site name / publisher */
  siteName?: string;
  /** Primary author or byline */
  author?: string;
  /** Publication ISO datetime string */
  publishedTime?: string;
  /** Last modification ISO datetime string */
  modifiedTime?: string;
  /** Page language code (e.g. en, vi, ja) */
  language?: string;
  /** Keywords or tags */
  keywords: string[];
  /** OpenGraph key-value dictionary */
  openGraph: Record<string, string>;
  /** Twitter card key-value dictionary */
  twitterCard: Record<string, string>;
  /** Extracted and parsed JSON-LD raw objects */
  jsonLd: Record<string, any>[];
  /** Recognized Product Schema if present */
  product?: ProductMetadata;
  /** Recognized Article / NewsArticle Schema if present */
  article?: ArticleMetadata;
}

export interface ProductMetadata {
  name?: string;
  sku?: string;
  price?: string | number;
  currency?: string;
  availability?: string;
  brand?: string;
  ratingValue?: number;
  reviewCount?: number;
  images: string[];
}

export interface ArticleMetadata {
  headline?: string;
  author?: string;
  publisher?: string;
  datePublished?: string;
  dateModified?: string;
  section?: string;
  wordCount?: number;
  tags: string[];
}
