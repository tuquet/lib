import type {
  CanonicalCrawlDocument,
  DualSinkConfig,
  StorageSaveResult,
  StorageSink,
} from '../types.js';

export class DualStorageSink implements StorageSink {
  readonly name: string;
  constructor(private readonly config: DualSinkConfig) {
    this.name = `dual(${config.primary.name}+${config.secondary.name})`;
  }

  async exists(
    urlHash: string,
    contentHash?: string
  ): Promise<{ exists: boolean; unchanged: boolean }> {
    return this.config.primary.exists(urlHash, contentHash);
  }

  async save(document: CanonicalCrawlDocument): Promise<StorageSaveResult> {
    const [pRes, sRes] = await Promise.allSettled([
      this.config.primary.save(document),
      this.config.secondary.save(document),
    ]);

    if (pRes.status === 'rejected') {
      return {
        success: false,
        action: 'error',
        documentId: document.identity.urlHash,
        urlHash: document.identity.urlHash,
        contentHash: document.lifecycle.contentHash,
        error: `Primary (${this.config.primary.name}) failed: ${pRes.reason}`,
      };
    }

    if (sRes.status === 'rejected' && this.config.failOnError && pRes.value.success) {
      return {
        ...pRes.value,
        success: false,
        error: `Secondary (${this.config.secondary.name}) error: ${sRes.reason}`,
      };
    }

    return pRes.value;
  }
}
