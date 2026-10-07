import { extractMetaPrefix } from './standard.js';

/**
 * Extracts all OpenGraph properties (og:*) from document meta tags
 */
export const extractOpenGraph = (root: Document | Element | any): Record<string, string> =>
  extractMetaPrefix(root, 'og:');
