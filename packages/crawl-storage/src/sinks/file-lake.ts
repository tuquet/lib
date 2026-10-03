import type {
  CanonicalCrawlDocument,
  FileLakeSinkConfig,
  StorageSaveResult,
  StorageSink,
} from '../types.js';

export class FileLakeStorageSink implements StorageSink {
  readonly name = 'file-lake';
  private readonly outputDir: string;
  private readonly format: 'jsonl' | 'markdown' | 'both';
  private readonly organizeByDomain: boolean;

  constructor(config: FileLakeSinkConfig) {
    this.outputDir = config.outputDir.replace(/\/+$/, '');
    this.format = config.format ?? 'both';
    this.organizeByDomain = config.organizeByDomain ?? true;
  }

  static toMarkdownWithFrontmatter(doc: CanonicalCrawlDocument): string {
    const yamlLines = [
      '---',
      `id: "${doc.id}"`,
      `url: "${doc.identity.url}"`,
      `normalized_url: "${doc.identity.normalizedUrl}"`,
      `domain: "${doc.identity.domain}"`,
      `page_type: "${doc.identity.pageType}"`,
      `title: ${JSON.stringify(doc.content.title)}`,
      `crawled_at: "${doc.lifecycle.crawledAt}"`,
      `content_hash: "${doc.lifecycle.contentHash}"`,
      `raw_tokens: ${doc.content.tokenSavings.rawTokens}`,
      `clean_tokens: ${doc.content.tokenSavings.cleanTokens}`,
      `token_reduction_percent: ${doc.content.tokenSavings.reductionPercent}`,
    ];

    if (doc.payload && Object.keys(doc.payload).length > 0) {
      yamlLines.push('payload:');
      for (const [k, v] of Object.entries(doc.payload)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          yamlLines.push(`  ${k}: ${JSON.stringify(v)}`);
        }
      }
    }

    yamlLines.push('---', '', doc.content.markdown);
    return yamlLines.join('\n');
  }

  async exists(
    _urlHash: string,
    _contentHash?: string
  ): Promise<{ exists: boolean; unchanged: boolean }> {
    return { exists: false, unchanged: false };
  }

  async save(doc: CanonicalCrawlDocument): Promise<StorageSaveResult> {
    const urlHash = doc.identity.urlHash;
    const contentHash = doc.lifecycle.contentHash;

    try {
      // Check if Node fs is available
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const domain = this.organizeByDomain ? doc.identity.domain : '';
      const targetDir = domain ? path.join(this.outputDir, domain) : this.outputDir;
      await fs.mkdir(targetDir, { recursive: true });

      // 1. Save Markdown with YAML Frontmatter
      if (this.format === 'markdown' || this.format === 'both') {
        const mdContent = FileLakeStorageSink.toMarkdownWithFrontmatter(doc);
        const mdPath = path.join(targetDir, `${urlHash}.md`);
        await fs.writeFile(mdPath, mdContent, 'utf8');
      }

      // 2. Append to JSONL Lake
      if (this.format === 'jsonl' || this.format === 'both') {
        const jsonlPath = path.join(targetDir, 'stream.jsonl');
        const line = JSON.stringify(doc) + '\n';
        await fs.appendFile(jsonlPath, line, 'utf8');
      }

      return {
        success: true,
        action: 'inserted',
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
}
