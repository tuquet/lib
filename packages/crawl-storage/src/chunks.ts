import type { RagChunk } from './types.js';
import { syncHash } from './normalize.js';

export interface ChunkOptions {
  maxTokens?: number;
  minTokens?: number;
}

/**
 * Splits a clean Markdown document into contextual RAG chunks partitioned by Heading hierarchy.
 * Preserves heading breadcrumb paths so vector embeddings retain semantic context.
 */
export function createRagChunks(markdown: string, options: ChunkOptions = {}): RagChunk[] {
  const maxTokens = options.maxTokens ?? 500;
  const minTokens = options.minTokens ?? 50;

  if (!markdown || !markdown.trim()) {
    return [];
  }

  const lines = markdown.split('\n');
  const sections: Array<{ headingPath: string[]; lines: string[] }> = [];

  let currentHeadingPath: string[] = ['Introduction'];
  let currentLines: string[] = [];

  const headingRegex = /^(#{1,6})\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      if (currentLines.some((l) => l.trim().length > 0)) {
        sections.push({
          headingPath: [...currentHeadingPath],
          lines: [...currentLines],
        });
        currentLines = [];
      }

      const level = match[1].length;
      const title = match[2].trim();

      // Adjust heading path based on level
      if (level === 1) {
        currentHeadingPath = [title];
      } else {
        currentHeadingPath = currentHeadingPath.slice(0, level - 1);
        currentHeadingPath.push(title);
      }
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.some((l) => l.trim().length > 0)) {
    sections.push({
      headingPath: [...currentHeadingPath],
      lines: [...currentLines],
    });
  }

  const chunks: RagChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const text = section.lines.join('\n').trim();
    if (!text) continue;

    const estimatedTokens = Math.ceil(text.length / 4);

    // If within budget, keep as single chunk
    if (estimatedTokens <= maxTokens) {
      chunks.push({
        chunkId: `chunk_${chunkIndex++}_${syncHash(text).slice(0, 8)}`,
        headingPath: section.headingPath,
        text,
        tokens: estimatedTokens,
      });
    } else {
      // Split by paragraphs
      const paragraphs = text.split(/\n\s*\n/);
      let buffer: string[] = [];
      let bufferTokens = 0;

      for (const para of paragraphs) {
        const pTokens = Math.ceil(para.length / 4);
        if (bufferTokens + pTokens > maxTokens && buffer.length > 0) {
          const chunkText = buffer.join('\n\n').trim();
          chunks.push({
            chunkId: `chunk_${chunkIndex++}_${syncHash(chunkText).slice(0, 8)}`,
            headingPath: section.headingPath,
            text: chunkText,
            tokens: bufferTokens,
          });
          buffer = [para];
          bufferTokens = pTokens;
        } else {
          buffer.push(para);
          bufferTokens += pTokens;
        }
      }

      if (buffer.length > 0) {
        const chunkText = buffer.join('\n\n').trim();
        chunks.push({
          chunkId: `chunk_${chunkIndex++}_${syncHash(chunkText).slice(0, 8)}`,
          headingPath: section.headingPath,
          text: chunkText,
          tokens: bufferTokens,
        });
      }
    }
  }

  // Merge any trailing chunk that is too small with the previous chunk if in the same section
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1];
    const prev = chunks[chunks.length - 2];
    if (
      last.tokens < minTokens &&
      prev.headingPath.join(' > ') === last.headingPath.join(' > ') &&
      prev.tokens + last.tokens <= maxTokens * 1.3
    ) {
      prev.text += `\n\n${last.text}`;
      prev.tokens += last.tokens;
      chunks.pop();
    }
  }

  return chunks;
}
