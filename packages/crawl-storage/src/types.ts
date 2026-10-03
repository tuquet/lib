export type PageType = 'article' | 'product' | 'listing' | 'documentation' | 'homepage' | 'unknown';

export interface CanonicalIdentity {
  url: string;
  urlHash: string;
  normalizedUrl: string;
  domain: string;
  pageType: PageType;
}

export interface CanonicalLifecycle {
  crawledAt: string;
  contentHash: string;
  httpStatus: number;
  executionMs: number;
}

export interface CanonicalContent {
  title: string;
  markdown: string;
  excerpt: string;
  tokenSavings: {
    rawTokens: number;
    cleanTokens: number;
    reductionPercent: number;
  };
}

export interface RagChunk {
  chunkId: string;
  headingPath: string[];
  text: string;
  tokens: number;
  embedding?: number[];
}

export interface CanonicalCrawlDocument {
  id: string;
  identity: CanonicalIdentity;
  lifecycle: CanonicalLifecycle;
  content: CanonicalContent;
  payload: Record<string, any>;
  rawMeta?: Record<string, any>;
  chunks?: RagChunk[];
}

export interface StorageSaveResult {
  success: boolean;
  action: 'inserted' | 'updated' | 'unchanged' | 'error';
  documentId: string;
  urlHash: string;
  contentHash: string;
  error?: string;
}

export interface StorageSink {
  readonly name: string;
  save(document: CanonicalCrawlDocument): Promise<StorageSaveResult>;
  exists(urlHash: string, contentHash?: string): Promise<{ exists: boolean; unchanged: boolean }>;
}

export interface SupabaseSinkConfig {
  supabaseUrl: string;
  supabaseKey: string;
  pagesTable?: string;
  documentsTable?: string;
  chunksTable?: string;
  autoSaveChunks?: boolean;
}

export interface MongoSinkConfig {
  endpointOrConnectionString: string;
  databaseName?: string;
  collectionName?: string;
  apiKey?: string;
}

export interface FileLakeSinkConfig {
  outputDir: string;
  format?: 'jsonl' | 'markdown' | 'both';
  organizeByDomain?: boolean;
}

export interface DualSinkConfig {
  primary: StorageSink;
  secondary: StorageSink;
  failOnError?: boolean;
}
