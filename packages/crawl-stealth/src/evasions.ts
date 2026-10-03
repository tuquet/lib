import type { StealthOptions } from './types.js';

/**
 * Applies stealth evasions directly in the current window context
 */
export function applyStealthInPage(options: StealthOptions = {}): void {
  if (typeof window === 'undefined') return;

  const {
    maskWebDriver = true,
    mockChromeRuntime = true,
    mockPlugins = true,
    languages = ['en-US', 'en'],
    webglVendor = 'Intel Inc.',
    webglRenderer = 'Intel Iris OpenGL Engine',
  } = options;

  // 1. Mask navigator.webdriver
  if (maskWebDriver) {
    try {
      Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
        get: () => undefined,
        configurable: true,
      });
      // Delete any own property on navigator
      delete (navigator as any).webdriver;
    } catch {
      // Ignore freeze/seal
    }
  }

  // 2. Mock window.chrome runtime
  if (mockChromeRuntime) {
    try {
      if (!(window as any).chrome) {
        (window as any).chrome = {};
      }
      const chrome = (window as any).chrome;
      if (!chrome.runtime) {
        chrome.runtime = {
          PlatformOs: {
            MAC: 'mac',
            WIN: 'win',
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            OPENBSD: 'openbsd',
          },
          PlatformArch: {
            ARM: 'arm',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
            MIPS: 'mips',
            MIPS64: 'mips64',
          },
          PlatformNaclArch: {
            ARM: 'arm',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
            MIPS: 'mips',
            MIPS64: 'mips64',
          },
          id: undefined,
        };
      }
      if (!chrome.loadTimes) {
        chrome.loadTimes = () => ({
          requestTime: performance.now() / 1000,
          startLoadTime: performance.now() / 1000,
          commitLoadTime: performance.now() / 1000,
          finishDocumentLoadTime: performance.now() / 1000,
          finishLoadTime: performance.now() / 1000,
          firstPaintTime: performance.now() / 1000,
          firstPaintAfterLoadTime: 0,
          navigationType: 'Other',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'h2',
        });
      }
      if (!chrome.csi) {
        chrome.csi = () => ({
          startE: Date.now(),
          onloadT: Date.now(),
          pageT: performance.now(),
          tran: 15,
        });
      }
    } catch {
      // Ignore
    }
  }

  // 3. Languages
  if (languages && languages.length > 0) {
    try {
      Object.defineProperty(Object.getPrototypeOf(navigator), 'languages', {
        get: () => languages,
        configurable: true,
      });
      Object.defineProperty(Object.getPrototypeOf(navigator), 'language', {
        get: () => languages[0],
        configurable: true,
      });
    } catch {
      // Ignore
    }
  }

  // 4. Mock Plugins
  if (mockPlugins) {
    try {
      const fakePlugins = [
        {
          name: 'Chrome PDF Plugin',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format',
        },
        {
          name: 'Chrome PDF Viewer',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          description: '',
        },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
      ];
      Object.defineProperty(Object.getPrototypeOf(navigator), 'plugins', {
        get: () => fakePlugins,
        configurable: true,
      });
    } catch {
      // Ignore
    }
  }

  // 5. Mock WebGL Vendor & Renderer
  if (webglVendor || webglRenderer) {
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
        // UNMASKED_VENDOR_WEBGL (0x9245)
        if (parameter === 37445 && webglVendor) {
          return webglVendor;
        }
        // UNMASKED_RENDERER_WEBGL (0x9246)
        if (parameter === 37446 && webglRenderer) {
          return webglRenderer;
        }
        return getParameter.apply(this, [parameter]);
      };
    } catch {
      // WebGL might not be supported in this environment
    }
  }

  // 6. Fix Permissions Query
  if (navigator.permissions && typeof navigator.permissions.query === 'function') {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = function (parameters: any) {
      if (parameters && parameters.name === 'notifications') {
        return Promise.resolve({
          state: (Notification && Notification.permission) || 'default',
          onchange: null,
        } as any);
      }
      return originalQuery.apply(this, [parameters]);
    };
  }
}

/**
 * Returns a minified, self-executing JavaScript string intended for injection
 * via CDP (Page.addScriptToEvaluateOnNewDocument) before page scripts execute.
 */
export function getStealthInjectionScript(options: StealthOptions = {}): string {
  const opts = JSON.stringify(options);
  return `(() => {
    const options = ${opts};
    try {
      if (options.maskWebDriver !== false) {
        Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
          get: () => undefined,
          configurable: true,
        });
        delete navigator.webdriver;
      }
      if (options.mockChromeRuntime !== false) {
        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = { id: undefined };
        if (!window.chrome.loadTimes) window.chrome.loadTimes = () => ({ requestTime: performance.now() / 1000 });
        if (!window.chrome.csi) window.chrome.csi = () => ({ pageT: performance.now() });
      }
      if (options.languages && options.languages.length) {
        Object.defineProperty(Object.getPrototypeOf(navigator), 'languages', {
          get: () => options.languages,
          configurable: true,
        });
      }
      if (options.mockPlugins !== false) {
        const fakePlugins = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
        ];
        Object.defineProperty(Object.getPrototypeOf(navigator), 'plugins', {
          get: () => fakePlugins,
          configurable: true,
        });
      }
      if (typeof WebGLRenderingContext !== 'undefined' && (options.webglVendor || options.webglRenderer)) {
        const origGetParam = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(p) {
          if (p === 37445 && options.webglVendor) return options.webglVendor;
          if (p === 37446 && options.webglRenderer) return options.webglRenderer;
          return origGetParam.apply(this, [p]);
        };
      }
    } catch (e) {}
  })();`;
}
