import { extractMetaPrefix } from './standard.js';

/**
 * Extracts all Twitter card properties (twitter:*) from document meta tags
 */
export const extractTwitterCard = (root: Document | Element | any): Record<string, string> =>
  extractMetaPrefix(root, 'twitter:');
