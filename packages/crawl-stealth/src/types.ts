export interface StealthOptions {
  /** Unmasked WebGL vendor string (default: "Intel Inc.") */
  webglVendor?: string;
  /** Unmasked WebGL renderer string (default: "Intel Iris OpenGL Engine") */
  webglRenderer?: string;
  /** Spoofed language list (default: ['en-US', 'en']) */
  languages?: string[];
  /** Whether to inject realistic Chrome runtime object (default: true) */
  mockChromeRuntime?: boolean;
  /** Whether to mask navigator.webdriver property (default: true) */
  maskWebDriver?: boolean;
  /** Whether to spoof navigator.plugins array (default: true) */
  mockPlugins?: boolean;
  /** Whether to inject subtle noise on Canvas readback (default: true) */
  canvasNoise?: boolean;
}
