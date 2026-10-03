-- ============================================================================
-- TUQUET CRAWLER ENGINE - ENTERPRISE SUPABASE SCHEMA DDL
-- Dual-Layer Hybrid Architecture (Strict Relational + Flexible JSONB + pgvector)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Domain / Source Management Table
CREATE TABLE IF NOT EXISTS crawler_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    rate_limit_per_min INT DEFAULT 60,
    robots_allowed BOOLEAN DEFAULT true,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Core Pages Table (Identity, Lifecycle & Deduplication Anchor)
CREATE TABLE IF NOT EXISTS crawler_pages (
    url_hash VARCHAR(64) PRIMARY KEY,
    url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    domain TEXT NOT NULL,
    page_type VARCHAR(32) DEFAULT 'unknown',
    http_status SMALLINT DEFAULT 200,
    content_hash VARCHAR(64) NOT NULL,
    first_crawled_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    version INT DEFAULT 1,
    execution_ms INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crawler_pages_domain ON crawler_pages(domain);
CREATE INDEX IF NOT EXISTS idx_crawler_pages_page_type ON crawler_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_crawler_pages_content_hash ON crawler_pages(content_hash);
CREATE INDEX IF NOT EXISTS idx_crawler_pages_last_seen ON crawler_pages(last_seen_at DESC);

-- 4. Clean Documents Table (LLM/RAG Text & Polymorphic JSONB)
CREATE TABLE IF NOT EXISTS crawler_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_url_hash VARCHAR(64) NOT NULL REFERENCES crawler_pages(url_hash) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    excerpt TEXT,
    extracted_payload JSONB DEFAULT '{}'::jsonb,
    raw_meta JSONB DEFAULT '{}'::jsonb,
    token_stats JSONB DEFAULT '{}'::jsonb,
    crawled_at TIMESTAMPTZ DEFAULT now()
);

-- High-performance GIN indexes on JSONB for sub-document queries (e.g. price, author, sku)
CREATE INDEX IF NOT EXISTS idx_crawler_docs_payload_gin ON crawler_documents USING GIN (extracted_payload jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_crawler_docs_meta_gin ON crawler_documents USING GIN (raw_meta jsonb_path_ops);

-- Full-text search index across titles and markdown text
CREATE INDEX IF NOT EXISTS idx_crawler_docs_fts ON crawler_documents USING GIN (to_tsvector('simple', title || ' ' || COALESCE(excerpt, '')));

-- 5. RAG Chunks & Vector Store (Native pgvector embedding search)
CREATE TABLE IF NOT EXISTS crawler_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES crawler_documents(id) ON DELETE CASCADE,
    page_url_hash VARCHAR(64) NOT NULL,
    chunk_id TEXT NOT NULL,
    heading_path TEXT[] DEFAULT '{}',
    text TEXT NOT NULL,
    tokens INT DEFAULT 0,
    embedding vector(1536), -- Standard embedding dimension (OpenAI / text-embedding-3 or adapt to 768)
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crawler_chunks_doc ON crawler_chunks(document_id);
-- HNSW Vector index for ultra-fast Approximate Nearest Neighbor cosine similarity search
CREATE INDEX IF NOT EXISTS idx_crawler_chunks_embedding ON crawler_chunks USING hnsw (embedding vector_cosine_ops);

-- 6. Helper Function: Semantic Hybrid Search
-- Combines full-text filtering with vector similarity in a single query
CREATE OR REPLACE FUNCTION match_crawler_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_domain text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    text TEXT,
    heading_path TEXT[],
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.text,
        c.heading_path,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM crawler_chunks c
    JOIN crawler_pages p ON c.page_url_hash = p.url_hash
    WHERE (filter_domain IS NULL OR p.domain = filter_domain)
      AND (c.embedding IS NOT NULL)
      AND (1 - (c.embedding <=> query_embedding)) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
