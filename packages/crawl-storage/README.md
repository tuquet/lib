# @tuquet/crawl-storage

Enterprise dual-layer storage adapters and canonical document schemas for web crawlers, supporting Supabase (PostgreSQL + pgvector), MongoDB, and Lakehouse architectures.

## Features

- **Decoupled Architecture**: Abstract `StorageSink` interface separates the crawl engine from any specific database backend.
- **Enterprise URL Normalizer**: Strips tracking parameters (`utm_*`, `fbclid`, etc.), sorts query parameters deterministically, and generates collision-resistant SHA hashes.
- **Deduplication by Content Hash**: Calculates SHA-256 on clean Markdown. Identical content across crawls updates `last_seen_at` without duplicating database rows or re-generating expensive vector embeddings.
- **Supabase AI-Ready Sink**: Direct PostgREST integration targeting relational `crawler_pages`, JSONB `crawler_documents`, and native `crawler_chunks` with `pgvector` HNSW indexes.
- **MongoDB NoSQL Sink**: Formats canonical crawl documents into rich nested BSON collections with optional TTL indices.
- **FileLake & Dual Dispatch**: Local Markdown with YAML frontmatter + JSONL streaming, with concurrent dual-destination dispatching.
- **RAG Chunking**: Context-preserving Markdown partitioning based on heading hierarchies.

## Installation

```bash
pnpm add @tuquet/crawl-storage
```

## Quick Start

```ts
import {
  buildCanonicalDocument,
  SupabaseStorageSink,
  FileLakeStorageSink,
  DualStorageSink,
} from '@tuquet/crawl-storage';

// 1. Build a canonical normalized document from crawl results
const document = buildCanonicalDocument({
  url: 'https://example.com/blog/article?utm_source=twitter',
  title: 'Understanding Modern Web Scraping',
  markdown: '# Understanding Modern Web Scraping\n\nContent goes here...',
  pageType: 'article',
  payload: { author: 'Tuquet Team', publishedTime: '2026-10-04' },
});

// 2. Setup Sinks
const supabaseSink = new SupabaseStorageSink({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_KEY!,
});

const fileLakeSink = new FileLakeStorageSink({
  outputDir: './data/crawls',
  format: 'both',
});

// 3. Dispatch to both Supabase (AI/RAG) and Local Lakehouse
const dualSink = new DualStorageSink({
  primary: supabaseSink,
  secondary: fileLakeSink,
});

await dualSink.save(document);
```

## License

MIT © Tuquet
