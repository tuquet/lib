import type {
  CanonicalCrawlDocument,
  StorageSaveResult,
  StorageSink,
  SupabaseSinkConfig,
} from '../types.js';

export class SupabaseStorageSink implements StorageSink {
  readonly name = 'supabase';
  private readonly url: string;
  private readonly key: string;
  private readonly pagesTable: string;
  private readonly documentsTable: string;
  private readonly chunksTable: string;
  private readonly autoSaveChunks: boolean;

  constructor(config: SupabaseSinkConfig) {
    this.url = config.supabaseUrl.replace(/\/+$/, '');
    this.key = config.supabaseKey;
    this.pagesTable = config.pagesTable ?? 'crawler_pages';
    this.documentsTable = config.documentsTable ?? 'crawler_documents';
    this.chunksTable = config.chunksTable ?? 'crawler_chunks';
    this.autoSaveChunks = config.autoSaveChunks ?? true;
  }

  private headers(prefer = 'return=representation'): Record<string, string> {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    };
  }

  async exists(
    urlHash: string,
    contentHash?: string
  ): Promise<{ exists: boolean; unchanged: boolean }> {
    try {
      const endpoint = `${this.url}/rest/v1/${this.pagesTable}?url_hash=eq.${encodeURIComponent(urlHash)}&select=url_hash,content_hash`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: this.headers(),
      });

      if (!res.ok) {
        return { exists: false, unchanged: false };
      }

      const rows: any[] = ((await res.json()) as any[]) || [];
      if (!rows || rows.length === 0) {
        return { exists: false, unchanged: false };
      }

      const existing = rows[0];
      const unchanged = !!contentHash && existing.content_hash === contentHash;
      return { exists: true, unchanged };
    } catch {
      return { exists: false, unchanged: false };
    }
  }

  async save(document: CanonicalCrawlDocument): Promise<StorageSaveResult> {
    const { identity, lifecycle, content, payload, rawMeta, chunks } = document;
    const urlHash = identity.urlHash;
    const contentHash = lifecycle.contentHash;

    try {
      // 1. Check existing record
      const check = await this.exists(urlHash, contentHash);

      // 2. If content is unchanged, update last_seen_at only (Deduplication save)
      if (check.exists && check.unchanged) {
        const patchUrl = `${this.url}/rest/v1/${this.pagesTable}?url_hash=eq.${encodeURIComponent(urlHash)}`;
        await fetch(patchUrl, {
          method: 'PATCH',
          headers: this.headers(),
          body: JSON.stringify({
            last_seen_at: lifecycle.crawledAt,
            execution_ms: lifecycle.executionMs,
          }),
        });

        return {
          success: true,
          action: 'unchanged',
          documentId: urlHash,
          urlHash,
          contentHash,
        };
      }

      // 3. Upsert into pagesTable
      const pageRecord = {
        url_hash: urlHash,
        url: identity.url,
        normalized_url: identity.normalizedUrl,
        domain: identity.domain,
        page_type: identity.pageType,
        http_status: lifecycle.httpStatus,
        content_hash: contentHash,
        last_seen_at: lifecycle.crawledAt,
        execution_ms: lifecycle.executionMs,
      };

      const pagesEndpoint = `${this.url}/rest/v1/${this.pagesTable}?on_conflict=url_hash`;
      const pageRes = await fetch(pagesEndpoint, {
        method: 'POST',
        headers: this.headers('resolution=merge-duplicates,return=representation'),
        body: JSON.stringify(pageRecord),
      });

      if (!pageRes.ok) {
        const errText = await pageRes.text();
        throw new Error(`Failed to upsert page record: ${pageRes.status} ${errText}`);
      }

      // 4. Insert into documentsTable
      const docRecord = {
        page_url_hash: urlHash,
        title: content.title,
        content_markdown: content.markdown,
        excerpt: content.excerpt,
        extracted_payload: payload,
        raw_meta: rawMeta ?? {},
        token_stats: content.tokenSavings,
        crawled_at: lifecycle.crawledAt,
      };

      const docEndpoint = `${this.url}/rest/v1/${this.documentsTable}`;
      const docRes = await fetch(docEndpoint, {
        method: 'POST',
        headers: this.headers('return=representation'),
        body: JSON.stringify(docRecord),
      });

      if (!docRes.ok) {
        const errText = await docRes.text();
        throw new Error(`Failed to insert document record: ${docRes.status} ${errText}`);
      }

      const docData: any[] = ((await docRes.json()) as any[]) || [];
      const savedDocId = docData[0]?.id ? String(docData[0].id) : urlHash;

      // 5. Optionally save RAG chunks
      if (this.autoSaveChunks && chunks && chunks.length > 0) {
        const chunkRecords = chunks.map((c) => ({
          document_id: savedDocId,
          page_url_hash: urlHash,
          chunk_id: c.chunkId,
          heading_path: c.headingPath,
          text: c.text,
          tokens: c.tokens,
          embedding: c.embedding ?? null,
        }));

        const chunkEndpoint = `${this.url}/rest/v1/${this.chunksTable}`;
        await fetch(chunkEndpoint, {
          method: 'POST',
          headers: this.headers('return=minimal'),
          body: JSON.stringify(chunkRecords),
        });
      }

      return {
        success: true,
        action: check.exists ? 'updated' : 'inserted',
        documentId: savedDocId,
        urlHash,
        contentHash,
      };
    } catch (err: any) {
      return {
        success: false,
        action: 'error',
        documentId: urlHash,
        urlHash,
        contentHash,
        error: err?.message || String(err),
      };
    }
  }
}
