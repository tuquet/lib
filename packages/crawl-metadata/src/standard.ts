/**
 * Extracts standard metadata elements (title, canonical, description, keywords, lang)
 */
export function extractStandardMeta(root: Document | Element | any) {
  const getMeta = (name: string): string | undefined => {
    const el = root.querySelector(`meta[name="${name}" i], meta[property="${name}" i]`);
    return el ? el.getAttribute('content')?.trim() || undefined : undefined;
  };

  const titleEl = root.querySelector('title');
  const title =
    titleEl?.textContent?.trim() || root.querySelector('h1')?.textContent?.trim() || undefined;

  const description = getMeta('description');
  const author = getMeta('author') || getMeta('article:author') || getMeta('byline');
  const keywordsRaw = getMeta('keywords');
  const keywords = keywordsRaw
    ? keywordsRaw
        .split(',')
        .map((k: string) => k.trim())
        .filter(Boolean)
    : [];

  const canonicalEl = root.querySelector('link[rel="canonical"]');
  const canonical = canonicalEl ? canonicalEl.getAttribute('href')?.trim() || undefined : undefined;

  const langEl = root.querySelector('html');
  const language = langEl?.getAttribute('lang')?.trim() || undefined;

  const publishedTime =
    getMeta('article:published_time') ||
    getMeta('publication_date') ||
    getMeta('date') ||
    root.querySelector('time[datetime]')?.getAttribute('datetime') ||
    undefined;

  const modifiedTime = getMeta('article:modified_time') || getMeta('lastmod') || undefined;

  return {
    title,
    description,
    author,
    keywords,
    canonical,
    language,
    publishedTime,
    modifiedTime,
  };
}
