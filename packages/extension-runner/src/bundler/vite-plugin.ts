import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export interface TuquetRunnerPluginOptions {
  /**
   * Path to source manifest.json or manifest.chrome.json template
   */
  manifestPath?: string;
  /**
   * Name suffix or override for runner manifest (default: "<Original> (Runner)")
   */
  name?: string;
  /**
   * Manifest version override (default: from source manifest or "1.0.0")
   */
  version?: string;
  /**
   * Path to extension icon to emit into dist
   */
  iconPath?: string;
  /**
   * Script file name for offscreen entry (default: "./offscreen.bundle.js")
   */
  offscreenScript?: string;
  /**
   * Script file name for sandbox entry (default: "./sandbox.bundle.js")
   */
  sandboxScript?: string;
}

/**
 * Vite plugin for packaging headless Extension Runner
 * Strips UI elements from Manifest V3 and generates offscreen/sandbox HTML scaffolds.
 */
export function tuquetRunnerPlugin(options: TuquetRunnerPluginOptions = {}): Plugin {
  return {
    name: 'tuquet-extension-runner-plugin',
    generateBundle() {
      const manifestPath =
        options.manifestPath || path.resolve(process.cwd(), 'src/manifest.chrome.json');

      if (fs.existsSync(manifestPath)) {
        try {
          const raw = fs.readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(raw);

          // Strip UI surface areas to keep runner purely headless
          delete manifest.action;
          delete manifest.options_ui;
          delete manifest.chrome_url_overrides;

          manifest.name = options.name || `${manifest.name || 'Tuquet'} (Runner)`;
          if (options.version) {
            manifest.version = options.version;
          } else if (!manifest.version) {
            manifest.version = '1.0.0';
          }

          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: JSON.stringify(manifest, null, 2),
          });
        } catch (e) {
          console.error('[tuquetRunnerPlugin] Failed to process manifest:', e);
        }
      }

      // 1. dummy.html (used for initial tab blank target)
      this.emitFile({
        type: 'asset',
        fileName: 'dummy.html',
        source:
          '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dummy</title></head><body></body></html>',
      });

      // 2. offscreen.html (runs offscreen document worker)
      const offscreenScript = options.offscreenScript || './offscreen.bundle.js';
      this.emitFile({
        type: 'asset',
        fileName: 'offscreen.html',
        source: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offscreen Runner</title></head><body><iframe src="/sandbox.html" id="sandbox" style="display: none;"></iframe><script type="module" src="${offscreenScript}"></script></body></html>`,
      });

      // 3. sandbox.html (evaluates sandboxed scripts)
      const sandboxScript = options.sandboxScript || './sandbox.bundle.js';
      this.emitFile({
        type: 'asset',
        fileName: 'sandbox.html',
        source: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sandbox</title></head><body><script type="module" src="${sandboxScript}"></script></body></html>`,
      });

      // 4. Optional Icon emission
      if (options.iconPath && fs.existsSync(options.iconPath)) {
        try {
          this.emitFile({
            type: 'asset',
            fileName: 'icon-128.png',
            source: fs.readFileSync(options.iconPath),
          });
        } catch (err) {
          console.error('[tuquetRunnerPlugin] Failed to emit icon asset:', err);
        }
      }
    },
  };
}
