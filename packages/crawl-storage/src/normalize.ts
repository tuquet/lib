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
 * Fast synchronous 64-bit Murmur-inspired hash for fallback & synchronous ID generation.
 */
export function fastHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`;
}

/**
 * Standard SHA-256 hex string using Web Crypto API (supported in Node 18+, browser, Deno, CF Workers).
 */
export async function sha256(text: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return fastHash(text).repeat(4).slice(0, 64);
}

/**
 * Synchronous hash generator producing a deterministic 32-character hex key.
 */
export function syncHash(text: string): string {
  return (fastHash(text) + fastHash(text.split('').reverse().join(''))).slice(0, 32);
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
