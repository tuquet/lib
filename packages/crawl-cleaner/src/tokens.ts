/**
 * Minifies Markdown content to minimize token consumption when passing to LLMs.
 */
export const minifyTokens = (markdown: string): string =>
  markdown
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Calculates approximate LLM tokens saved by comparing raw HTML vs Clean Markdown.
 */
export const estimateTokenSavings = (rawHtml: string, cleanMarkdown: string) => {
  const rawTokens = Math.ceil(rawHtml.length / 4);
  const cleanTokens = Math.ceil(cleanMarkdown.length / 4);
  return {
    rawTokens,
    cleanTokens,
    reductionPercent:
      rawTokens > 0 ? Math.max(0, Math.round(((rawTokens - cleanTokens) / rawTokens) * 100)) : 0,
  };
};
