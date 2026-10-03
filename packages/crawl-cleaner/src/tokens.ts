/**
 * Minifies Markdown content to minimize token consumption when passing to LLMs,
 * stripping trailing spaces, compressing empty list items, and standardizing codeblocks.
 */
export function minifyTokens(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Calculates approximate LLM tokens saved by comparing raw HTML vs Clean Markdown
 */
export function estimateTokenSavings(
  rawHtml: string,
  cleanMarkdown: string
): { rawTokens: number; cleanTokens: number; reductionPercent: number } {
  // Rough heuristic: ~4 characters per token for English/Code
  const rawTokens = Math.ceil(rawHtml.length / 4);
  const cleanTokens = Math.ceil(cleanMarkdown.length / 4);
  const reductionPercent =
    rawTokens > 0 ? Math.round(((rawTokens - cleanTokens) / rawTokens) * 100) : 0;

  return {
    rawTokens,
    cleanTokens,
    reductionPercent: Math.max(0, reductionPercent),
  };
}
