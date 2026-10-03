export interface SanitizeOptions {
  /** Remove all image elements (default: false) */
  removeImages?: boolean;
  /** Remove all hyperlinks, keeping only inner text (default: false) */
  removeLinks?: boolean;
  /** Keep data-* attributes (default: false) */
  keepDataAttributes?: boolean;
  /** Additional custom selectors to remove */
  customRemoveSelectors?: string[];
}

export interface MarkdownOptions {
  /** Whether to output images as ![alt](src) (default: true) */
  includeImages?: boolean;
  /** Whether to output links as [text](href) (default: true) */
  includeLinks?: boolean;
  /** Base URL to resolve relative URLs into absolute URLs */
  baseUrl?: string;
  /** Maximum consecutive newlines allowed (default: 2) */
  maxConsecutiveNewlines?: number;
}
