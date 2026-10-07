export interface DismissOptions {
  /** Root document or container element to search within */
  root?: Document | Element | any;
  /** Maximum number of modals/buttons to click (default: 5) */
  maxClicks?: number;
  /** Additional custom text keywords to match */
  customKeywords?: string[];
  /** Custom CSS selectors to attempt clicking */
  customSelectors?: string[];
}

export interface ScrollOptions {
  /** Target element to scroll (default: window) */
  target?: any;
  /** Scroll step in pixels (default: 400) */
  stepPx?: number;
  /** Delay between each scroll step in milliseconds (default: 150) */
  delayMs?: number;
  /** Maximum number of scroll steps before stopping (default: 20) */
  maxSteps?: number;
  /** Whether to scroll back to top after reaching bottom (default: true) */
  scrollBackToTop?: boolean;
}

export interface ScrollResult {
  /** Total steps executed */
  stepsExecuted: number;
  /** Final scroll height reached */
  scrollHeight: number;
  /** Duration elapsed in milliseconds */
  elapsedMs: number;
}

export interface IdleOptions {
  /** Quietness threshold in milliseconds (default: 500ms) */
  quietnessThresholdMs?: number;
  /** Maximum total wait timeout in milliseconds (default: 5000ms) */
  maxTimeoutMs?: number;
}

export interface ExpanderOptions {
  /** Root document or container */
  root?: Document | Element | any;
  /** Maximum buttons to click (default: 3) */
  maxClicks?: number;
  /** Additional custom text keywords (e.g. ['Xem thêm', 'Read more']) */
  customKeywords?: string[];
}
