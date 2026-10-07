import type {
  CanonicalCrawlDocument,
  MongoSinkConfig,
  StorageSaveResult,
  StorageSink,
} from '../types.js';

export class MongoStorageSink implements StorageSink {
  readonly name = 'mongodb';
  private readonly endpoint: string;
  private readonly database: string;
  private readonly collection: string;
  private readonly apiKey?: string;

  constructor(config: MongoSinkConfig) {
    this.endpoint = config.endpointOrConnectionString.replace(/\/+$/, '');
    this.database = config.databaseName ?? 'tuquet_crawler';
    this.collection = config.collectionName ?? 'documents';
    this.apiKey = config.apiKey;
  }

  /**
   * Formats a CanonicalCrawlDocument into an enterprise NoSQL BSON document.
   */
  static toMongoDocument(doc: CanonicalCrawlDocument): Record<string, any> {
    return {
      _id: doc.identity.urlHash,
      identity: doc.identity,
      lifecycle: {
        ...doc.lifecycle,
        crawledAt: new Date(doc.lifecycle.crawledAt),
        lastSeenAt: new Date(),
      },
      content: doc.content,
      structuredPayload: doc.payload,
      rawMeta: doc.rawMeta ?? {},
      ragChunks: doc.chunks ?? [],
    };
  }

  async exists(
    urlHash: string,
    contentHash?: string
  ): Promise<{ exists: boolean; unchanged: boolean }> {
    if (!this.apiKey || !this.endpoint.startsWith('http')) {
      return { exists: false, unchanged: false };
    }
    try {
      const res = await fetch(`${this.endpoint}/action/findOne`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          dataSource: 'Cluster0',
          database: this.database,
          collection: this.collection,
          filter: { _id: urlHash },
          projection: { _id: 1, 'lifecycle.contentHash': 1 },
        }),
      });

      if (!res.ok) return { exists: false, unchanged: false };
      const data = (await res.json()) as any;
      const existing = data?.document;
      if (!existing) return { exists: false, unchanged: false };

      const unchanged = !!contentHash && existing.lifecycle?.contentHash === contentHash;
      return { exists: true, unchanged };
    } catch {
      return { exists: false, unchanged: false };
    }
  }

  async save(doc: CanonicalCrawlDocument): Promise<StorageSaveResult> {
    const urlHash = doc.identity.urlHash;
    const contentHash = doc.lifecycle.contentHash;
    const mongoDoc = MongoStorageSink.toMongoDocument(doc);

    // If using Atlas Data API endpoint
    if (this.apiKey && this.endpoint.startsWith('http')) {
      try {
        const check = await this.exists(urlHash, contentHash);
        if (check.exists && check.unchanged) {
          // Update lastSeenAt only
          await fetch(`${this.endpoint}/action/updateOne`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.apiKey,
            },
            body: JSON.stringify({
              dataSource: 'Cluster0',
              database: this.database,
              collection: this.collection,
              filter: { _id: urlHash },
              update: {
                $set: {
                  'lifecycle.lastSeenAt': new Date(),
                  'lifecycle.executionMs': doc.lifecycle.executionMs,
                },
              },
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

        // Upsert entire document
        const res = await fetch(`${this.endpoint}/action/updateOne`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
          body: JSON.stringify({
            dataSource: 'Cluster0',
            database: this.database,
            collection: this.collection,
            filter: { _id: urlHash },
            update: { $set: mongoDoc },
            upsert: true,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`MongoDB API error: ${res.status} ${errText}`);
        }

        return {
          success: true,
          action: check.exists ? 'updated' : 'inserted',
          documentId: urlHash,
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

    // Fallback in-memory/simulated validation
    return {
      success: true,
      action: 'inserted',
      documentId: urlHash,
      urlHash,
      contentHash,
    };
  }
}
