/**
 * Extracts all Twitter card properties (twitter:*) from document meta tags
 */
export function extractTwitterCard(root: Document | Element | any): Record<string, string> {
  const twitter: Record<string, string> = {};
  const metas = Array.from(
    root.querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]')
  );

  for (const meta of metas as any[]) {
    const key = (meta.getAttribute('name') || meta.getAttribute('property') || '')
      .replace(/^twitter:/, '')
      .trim();
    const content = (meta.getAttribute('content') || '').trim();
    if (key && content) {
      twitter[key] = content;
    }
  }

  return twitter;
}
