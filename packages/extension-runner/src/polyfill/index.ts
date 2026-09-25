/**
 * Isomorphic Browser Polyfill
 * Resolves native browser/chrome in extensions, or seamlessly falls back to crash-proof Mock in Web/Studio.
 */

import { createBrowserMock } from './mock.js';

export * from './mock.js';

/**
 * Returns true if code is running inside a real browser extension context (Chrome, Edge, Firefox)
 */
export function isExtensionEnv(): boolean {
  if (typeof globalThis === 'undefined') return false;

  const hasBrowserId =
    typeof (globalThis as any).browser !== 'undefined' &&
    Boolean((globalThis as any).browser?.runtime?.id);
  const hasChromeId =
    typeof (globalThis as any).chrome !== 'undefined' &&
    Boolean((globalThis as any).chrome?.runtime?.id);

  return hasBrowserId || hasChromeId;
}

/**
 * Returns true if code is running in a web application context outside an extension
 */
export function isWebEnv(): boolean {
  return !isExtensionEnv();
}

let activeBrowserInstance: any = null;

/**
 * Resolves the active browser object
 */
export function getBrowserApi(): any {
  if (activeBrowserInstance) {
    return activeBrowserInstance;
  }

  // 1. Native Firefox browser API
  if (
    typeof (globalThis as any).browser !== 'undefined' &&
    (globalThis as any).browser?.runtime?.id
  ) {
    activeBrowserInstance = (globalThis as any).browser;
    return activeBrowserInstance;
  }

  // 2. Native Chrome MV3 chrome API
  if (
    typeof (globalThis as any).chrome !== 'undefined' &&
    (globalThis as any).chrome?.runtime?.id
  ) {
    activeBrowserInstance = (globalThis as any).chrome;
    return activeBrowserInstance;
  }

  // 3. Fallback: Safe Mock for Web Studio & Test environments
  activeBrowserInstance = createBrowserMock();
  return activeBrowserInstance;
}

export const browser = getBrowserApi();
export default browser;
