import type {
  CanonicalCrawlDocument,
  DualSinkConfig,
  StorageSaveResult,
  StorageSink,
} from '../types.js';

export class DualStorageSink implements StorageSink {
  readonly name: string;
  private readonly primary: StorageSink;
  private readonly secondary: StorageSink;
  private readonly failOnError: boolean;

  constructor(config: DualSinkConfig) {
    this.primary = config.primary;
    this.secondary = config.secondary;
    this.name = `dual(${this.primary.name}+${this.secondary.name})`;
    this.failOnError = config.failOnError ?? false;
  }

  async exists(
    urlHash: string,
    contentHash?: string
  ): Promise<{ exists: boolean; unchanged: boolean }> {
    return this.primary.exists(urlHash, contentHash);
  }

  async save(document: CanonicalCrawlDocument): Promise<StorageSaveResult> {
    const results = await Promise.allSettled([
      this.primary.save(document),
      this.secondary.save(document),
    ]);

    const primaryOutcome = results[0];
    const secondaryOutcome = results[1];

    let primaryResult: StorageSaveResult;
    if (primaryOutcome.status === 'fulfilled') {
      primaryResult = primaryOutcome.value;
    } else {
      primaryResult = {
        success: false,
        action: 'error',
        documentId: document.identity.urlHash,
        urlHash: document.identity.urlHash,
        contentHash: document.lifecycle.contentHash,
        error: `Primary (${this.primary.name}) failed: ${primaryOutcome.reason}`,
      };
    }

    if (secondaryOutcome.status === 'rejected') {
      console.warn(
        `[DualStorageSink] Secondary (${this.secondary.name}) failed:`,
        secondaryOutcome.reason
      );
      if (this.failOnError && primaryResult.success) {
        return {
          ...primaryResult,
          success: false,
          error: `Secondary (${this.secondary.name}) error: ${secondaryOutcome.reason}`,
        };
      }
    }

    return primaryResult;
  }
}
