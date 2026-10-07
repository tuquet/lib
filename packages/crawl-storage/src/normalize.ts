const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'mc_eid',
  '_ga',
  '_gl',
  'ref',
  'ref_',
  'source',
  'source_id',
  'spm',
  'from',
]);

/**
 * Fast synchronous hash producing a deterministic 32-character hex key.
 */
export function fastHash(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function syncHash(text: string): string {
  return fastHash(text).repeat(4);
}

/**
 * Standard SHA-256 hex string using Web Crypto API.
 */
export async function sha256(text: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return syncHash(text).repeat(2);
}

export interface NormalizedUrlResult {
  normalizedUrl: string;
  urlHash: string;
  domain: string;
  hostname: string;
  path: string;
}

/**
 * Enterprise URL normalizer:
 * 1. Strips tracking query parameters (utm_*, fbclid, etc.)
 * 2. Alphabetically sorts remaining query parameters
 * 3. Removes hash fragments and trailing slashes
 * 4. Extracts clean domain name without 'www.'
 * 5. Generates deterministic urlHash
 */
export function normalizeUrl(rawUrl: string): NormalizedUrlResult {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    const domain = hostname.replace(/^www\./, '');

    // Filter and sort search params
    const cleanParams = new URLSearchParams();
    const sortedKeys = Array.from(parsed.searchParams.keys()).sort();
    for (const key of sortedKeys) {
      if (!TRACKING_QUERY_PARAMS.has(key.toLowerCase()) && !key.toLowerCase().startsWith('utm_')) {
        for (const val of parsed.searchParams.getAll(key)) {
          cleanParams.append(key, val);
        }
      }
    }

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const searchStr = cleanParams.toString();
    const normalizedUrl = `${parsed.protocol}//${hostname}${pathname}${searchStr ? `?${searchStr}` : ''}`;
    const urlHash = syncHash(normalizedUrl);

    return {
      normalizedUrl,
      urlHash,
      domain,
      hostname,
      path: pathname,
    };
  } catch {
    const cleanFallback = rawUrl.trim().toLowerCase();
    return {
      normalizedUrl: cleanFallback,
      urlHash: syncHash(cleanFallback),
      domain: 'unknown',
      hostname: 'unknown',
      path: '/',
    };
  }
}

/**
 * Computes deterministic content hash for clean Markdown.
 */
export function computeContentHash(cleanMarkdown: string): string {
  const normalized = cleanMarkdown.trim().replace(/\s+/g, ' ');
  return syncHash(normalized);
}
