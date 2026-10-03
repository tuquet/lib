// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { applyStealthInPage, getStealthInjectionScript } from '../src/index.js';

describe('@tuquet/crawl-stealth', () => {
  it('masks navigator.webdriver property', () => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => true,
      configurable: true,
    });
    expect((navigator as any).webdriver).toBe(true);

    applyStealthInPage({ maskWebDriver: true });
    expect((navigator as any).webdriver).toBeUndefined();
  });

  it('injects realistic window.chrome runtime object', () => {
    applyStealthInPage({ mockChromeRuntime: true });
    expect((window as any).chrome).toBeDefined();
    expect((window as any).chrome.runtime).toBeDefined();
    expect(typeof (window as any).chrome.loadTimes).toBe('function');
  });

  it('generates self-executing string for CDP Page.addScriptToEvaluateOnNewDocument', () => {
    const script = getStealthInjectionScript({
      webglVendor: 'Apple Inc.',
      webglRenderer: 'Apple M3 Pro',
      languages: ['vi-VN', 'vi', 'en-US'],
    });

    expect(typeof script).toBe('string');
    expect(script).toContain('Apple Inc.');
    expect(script).toContain('Apple M3 Pro');
    expect(script).toContain('vi-VN');
    expect(script.startsWith('(() => {')).toBe(true);
    expect(script.endsWith('})();')).toBe(true);
  });
});
