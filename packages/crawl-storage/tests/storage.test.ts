import { describe, expect, it } from 'vitest';
import {
  buildCanonicalDocument,
  computeContentHash,
  createRagChunks,
  DualStorageSink,
  FileLakeStorageSink,
  MongoStorageSink,
  normalizeUrl,
  type StorageSaveResult,
  type StorageSink,
} from '../src/index.js';

describe('@tuquet/crawl-storage', () => {
  describe('normalizeUrl', () => {
    it('strips tracking query params and sorts remaining params deterministically', () => {
      const url1 =
        'https://Example.com/product/item-123/?utm_source=fb&z_param=1&a_param=2&fbclid=xyz#section-1';
      const url2 = 'https://example.com/product/item-123?a_param=2&utm_medium=cpc&z_param=1';

      const norm1 = normalizeUrl(url1);
      const norm2 = normalizeUrl(url2);

      expect(norm1.domain).toBe('example.com');
      expect(norm1.normalizedUrl).toBe('https://example.com/product/item-123?a_param=2&z_param=1');
      expect(norm2.normalizedUrl).toBe('https://example.com/product/item-123?a_param=2&z_param=1');
      expect(norm1.urlHash).toBe(norm2.urlHash);
      expect(norm1.urlHash.length).toBeGreaterThanOrEqual(16);
    });

    it('handles root URLs properly without trailing slash issues', () => {
      const norm = normalizeUrl('https://www.vnexpress.net/');
      expect(norm.domain).toBe('vnexpress.net');
      expect(norm.normalizedUrl).toBe('https://www.vnexpress.net/');
    });
  });

  describe('computeContentHash', () => {
    it('produces identical hash regardless of internal whitespace variations', () => {
      const text1 = '# Title\n\nThis is content with   extra   spaces.';
      const text2 = '# Title\nThis is content with extra spaces.';

      const hash1 = computeContentHash(text1);
      const hash2 = computeContentHash(text2);

      expect(hash1).toBe(hash2);
    });

    it('produces different hash when content changes', () => {
      const hash1 = computeContentHash('# Old Title');
      const hash2 = computeContentHash('# New Title');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createRagChunks', () => {
    it('partitions Markdown into contextual chunks with heading breadcrumbs', () => {
      const md = `
# Engineering Guide

Welcome to the engineering documentation.

## Database Architecture

We use PostgreSQL and Supabase for storage.

### Indexing Strategy

B-tree and GIN indexes provide O(1) retrieval speed.
      `.trim();

      const chunks = createRagChunks(md, { maxTokens: 200 });
      expect(chunks.length).toBeGreaterThan(0);

      const dbChunk = chunks.find((c) => c.text.includes('PostgreSQL'));
      expect(dbChunk).toBeDefined();
      expect(dbChunk?.headingPath).toContain('Database Architecture');

      const indexChunk = chunks.find((c) => c.text.includes('GIN indexes'));
      expect(indexChunk).toBeDefined();
      expect(indexChunk?.headingPath).toEqual([
        'Engineering Guide',
        'Database Architecture',
        'Indexing Strategy',
      ]);
    });
  });

  describe('buildCanonicalDocument', () => {
    it('creates a complete canonical document with token reduction metrics', () => {
      const doc = buildCanonicalDocument({
        url: 'https://books.toscrape.com/catalogue/book_1/index.html?utm_source=twitter',
        title: 'Book Title',
        markdown: '# Book Title\n\nPrice: £25.00',
        pageType: 'product',
        payload: { price: 25.0, currency: 'GBP', stock: 'In stock' },
        rawHtmlLength: 10000,
        executionMs: 15,
      });

      expect(doc.identity.domain).toBe('books.toscrape.com');
      expect(doc.identity.pageType).toBe('product');
      expect(doc.content.tokenSavings.rawTokens).toBe(2500);
      expect(doc.content.tokenSavings.reductionPercent).toBeGreaterThan(70);
      expect(doc.payload.price).toBe(25.0);
      expect(doc.chunks).toBeDefined();
    });
  });

  describe('FileLakeStorageSink', () => {
    it('formats document into Markdown with valid YAML frontmatter', () => {
      const doc = buildCanonicalDocument({
        url: 'https://example.com/test',
        title: 'Sample Document',
        markdown: '## Heading\n\nBody content.',
        pageType: 'article',
        payload: { author: 'Alice', views: 1200 },
      });

      const mdWithFrontmatter = FileLakeStorageSink.toMarkdownWithFrontmatter(doc);
      expect(mdWithFrontmatter).toContain('---');
      expect(mdWithFrontmatter).toContain('domain: "example.com"');
      expect(mdWithFrontmatter).toContain('page_type: "article"');
      expect(mdWithFrontmatter).toContain('author: "Alice"');
      expect(mdWithFrontmatter).toContain('## Heading');
    });
  });

  describe('MongoStorageSink', () => {
    it('formats document into enterprise BSON document structure', () => {
      const doc = buildCanonicalDocument({
        url: 'https://example.com/item',
        title: 'Item Title',
        markdown: '# Item Title',
        pageType: 'product',
        payload: { sku: 'SKU-999', price: 99 },
      });

      const mongoDoc = MongoStorageSink.toMongoDocument(doc);
      expect(mongoDoc._id).toBe(doc.identity.urlHash);
      expect(mongoDoc.identity.domain).toBe('example.com');
      expect(mongoDoc.structuredPayload.sku).toBe('SKU-999');
      expect(mongoDoc.lifecycle.contentHash).toBe(doc.lifecycle.contentHash);
    });
  });

  describe('DualStorageSink', () => {
    it('dispatches to both sinks concurrently', async () => {
      let sink1Called = false;
      let sink2Called = false;

      const mockSink1: StorageSink = {
        name: 'mock1',
        async save() {
          sink1Called = true;
          return {
            success: true,
            action: 'inserted',
            documentId: 'doc1',
            urlHash: 'hash1',
            contentHash: 'chash1',
          };
        },
        async exists() {
          return { exists: false, unchanged: false };
        },
      };

      const mockSink2: StorageSink = {
        name: 'mock2',
        async save() {
          sink2Called = true;
          return {
            success: true,
            action: 'inserted',
            documentId: 'doc2',
            urlHash: 'hash2',
            contentHash: 'chash2',
          };
        },
        async exists() {
          return { exists: false, unchanged: false };
        },
      };

      const dual = new DualStorageSink({
        primary: mockSink1,
        secondary: mockSink2,
      });

      const doc = buildCanonicalDocument({
        url: 'https://test.com',
        title: 'Test',
        markdown: 'Test',
      });

      const res: StorageSaveResult = await dual.save(doc);
      expect(res.success).toBe(true);
      expect(sink1Called).toBe(true);
      expect(sink2Called).toBe(true);
    });
  });
});
