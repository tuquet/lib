/**
 * Extracts all OpenGraph properties (og:*) from document meta tags
 */
export function extractOpenGraph(root: Document | Element | any): Record<string, string> {
  const og: Record<string, string> = {};
  const metas = Array.from(root.querySelectorAll('meta[property^="og:"], meta[name^="og:"]'));

  for (const meta of metas as any[]) {
    const key = (meta.getAttribute('property') || meta.getAttribute('name') || '')
      .replace(/^og:/, '')
      .trim();
    const content = (meta.getAttribute('content') || '').trim();
    if (key && content) {
      og[key] = content;
    }
  }

  return og;
}
