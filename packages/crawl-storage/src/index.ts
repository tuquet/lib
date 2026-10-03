import type {
  CanonicalContent,
  CanonicalCrawlDocument,
  CanonicalIdentity,
  CanonicalLifecycle,
  PageType,
} from './types.js';
import { computeContentHash, normalizeUrl, syncHash } from './normalize.js';
import { createRagChunks } from './chunks.js';

export * from './types.js';
export * from './normalize.js';
export * from './chunks.js';
export * from './sinks/supabase.js';
export * from './sinks/mongo.js';
export * from './sinks/file-lake.js';
export * from './sinks/dual.js';

export interface BuildCanonicalParams {
  url: string;
  title: string;
  markdown: string;
  pageType?: PageType;
  excerpt?: string;
  payload?: Record<string, any>;
  rawMeta?: Record<string, any>;
  rawHtmlLength?: number;
  httpStatus?: number;
  executionMs?: number;
  generateChunks?: boolean;
}

/**
 * Builds a standardized CanonicalCrawlDocument ready for storage across Supabase, MongoDB, or Data Lake.
 */
export function buildCanonicalDocument(params: BuildCanonicalParams): CanonicalCrawlDocument {
  const norm = normalizeUrl(params.url);
  const cleanMarkdown = params.markdown || '';
  const contentHash = computeContentHash(cleanMarkdown);

  const rawTokens = params.rawHtmlLength
    ? Math.ceil(params.rawHtmlLength / 4)
    : Math.ceil(cleanMarkdown.length / 4) * 4;
  const cleanTokens = Math.ceil(cleanMarkdown.length / 4);
  const reductionPercent =
    rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - cleanTokens) / rawTokens) * 100)) : 0;

  const identity: CanonicalIdentity = {
    url: params.url,
    urlHash: norm.urlHash,
    normalizedUrl: norm.normalizedUrl,
    domain: norm.domain,
    pageType: params.pageType ?? 'unknown',
  };

  const lifecycle: CanonicalLifecycle = {
    crawledAt: new Date().toISOString(),
    contentHash,
    httpStatus: params.httpStatus ?? 200,
    executionMs: params.executionMs ?? 0,
  };

  const content: CanonicalContent = {
    title: params.title || norm.domain,
    markdown: cleanMarkdown,
    excerpt: params.excerpt || cleanMarkdown.slice(0, 200).replace(/\s+/g, ' ').trim(),
    tokenSavings: {
      rawTokens,
      cleanTokens,
      reductionPercent,
    },
  };

  const chunks = params.generateChunks !== false ? createRagChunks(cleanMarkdown) : [];

  return {
    id: `doc_${norm.urlHash}_${contentHash.slice(0, 8)}`,
    identity,
    lifecycle,
    content,
    payload: params.payload ?? {},
    rawMeta: params.rawMeta ?? {},
    chunks,
  };
}
