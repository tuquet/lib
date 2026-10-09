<div align="center">
  <img src="https://tuquet.com/icons/extension-runner.svg" width="76" height="76" alt="Extension Runner Logo" />
  <h1>@tuquet/extension-runner</h1>
  <p><strong>Universal Isomorphic WebExtension Polyfill, Crash-Proof Mock Runtime &amp; Headless Bundler</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@tuquet/extension-runner"><img src="https://img.shields.io/npm/v/@tuquet/extension-runner.svg" alt="npm version" /></a>
    <img src="https://img.shields.io/badge/Manifest-V3%20Ready-brightgreen.svg" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/Tests-Passing-brightgreen.svg" alt="Tests" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  </p>
</div>

---

## 📖 Background & Problem Statement (Why This Library Exists)

In modern browser automation and Web Extension applications (such as Automa, Studio, Canvas Flow), engineers frequently encounter **two critical architectural challenges**:

1. **StorageArea Crash on Modern Chrome (v129+)**:
   Mozilla's original `webextension-polyfill` binds `StorageArea` in a manner that causes context loss, leading to fatal `Illegal invocation` or `TypeError: Cannot read properties of undefined` exceptions on recent Chromium versions.
2. **Difficulties Sharing UI Components between Extension & Web Studio (Isomorphism)**:
   Reusing canvas editors, block palettes, or form controls between a **Full Browser Extension** and an **External Web Studio (running standalone on web or Storybook)** causes crashes when invoking `browser.storage.local`, `browser.runtime.*`, or `browser.tabs.*` that do not natively exist in plain browser tabs.

👉 **`@tuquet/extension-runner` was engineered to resolve both challenges cleanly in a single, lightweight package.**

---

## ✨ Key Features

- 🌐 **Zero-Config Isomorphism**: Automatically detects execution environment:
  - **Extension Environment (Chrome MV3 / Firefox)**: Binds directly to native browser APIs without fragile wrappers.
  - **Web / Webview / Node / Test Environment**: Automatically activates the **Crash-Proof Mock Runtime**.
- 🛡️ **Recursive Safe Proxy**: Any Chrome/Browser API that is not explicitly mocked (e.g., `browser.cookies.getAll()`, `browser.contextMenus.create()`) is safely delegated through a recursive Proxy and returns `Promise.resolve({})`—**guaranteeing the UI never crashes**.
- 💾 **Full In-Memory & LocalStorage State**: Implements the full `browser.storage.local` API specification (`get`, `set`, `remove`, `clear`) alongside reactive change notifications via `storage.onChanged.addListener`.
- 📦 **Headless Runner Bundler Plugin**: Includes a dedicated Vite plugin that strips UI declarations from `manifest.json` and generates runner scaffolding (`dummy.html`, `offscreen.html`, `sandbox.html`) for ultra-lightweight headless workers.
- 🪶 **Zero-Dependency & Dual ESM/CJS**: Built with `tsup`, supporting both ECMAScript Modules (`.mjs`) and CommonJS (`.cjs`) with complete `.d.ts` declaration files.

---

## 📦 Installation

```bash
# Using pnpm (Recommended)
pnpm add @tuquet/extension-runner

# Using npm
npm install @tuquet/extension-runner

# Using yarn
yarn add @tuquet/extension-runner
```

---

## 🚀 Usage Guide

### 1. Isomorphic Polyfill in Vue 3 / TypeScript

Import the standard `browser` object directly:

```typescript
import browser, { isExtensionEnv, isWebEnv } from '@tuquet/extension-runner';

// 1. Detect current execution environment
if (isExtensionEnv()) {
  console.log('Running inside live Chrome Extension!');
} else {
  console.log('Running inside Web Studio / Storybook!');
}

// 2. Safely interact with Storage API across BOTH environments
async function saveWorkflow(workflow: any) {
  await browser.storage.local.set({
    [`workflow_${workflow.id}`]: workflow,
  });
}

async function loadWorkflow(workflowId: string) {
  const result = await browser.storage.local.get(`workflow_${workflowId}`);
  return result[`workflow_${workflowId}`];
}

// 3. Call un-mocked APIs without risking UI crashes
await browser.cookies.getAll({}); // Returns safe resolved Promise, never throws!
```

---

### 2. Listening to Storage Change Events (`onChanged`)

```typescript
import browser from '@tuquet/extension-runner';

// Real-time listener when a variable or active workflow updates
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.activeWorkflow) {
    console.log('Active workflow changed to:', changes.activeWorkflow.newValue);
  }
});
```

---

### 3. Vite Plugin Configuration for Headless Runner (`tuquetRunnerPlugin`)

When bundling a headless background runner extension (omitting popup/options UI to run offscreen automation scripts):

```typescript
// vite.runner.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { tuquetRunnerPlugin } from '@tuquet/extension-runner';

export default defineConfig({
  plugins: [
    vue(),
    tuquetRunnerPlugin({
      manifestPath: './src/manifest.chrome.json',
      name: 'Headless Automation Runner',
      version: '1.2.0',
      offscreenScript: './offscreen.bundle.js',
      sandboxScript: './sandbox.bundle.js',
    }),
  ],
  build: {
    outDir: 'dist/cli-runner',
  },
});
```

**The plugin automatically:**

1. Parses `manifest.chrome.json` and strips UI keys (`action`, `options_ui`, `chrome_url_overrides`).
2. Emits a sanitized `manifest.json` into `dist`.
3. Scaffolds `dummy.html`, `offscreen.html`, and `sandbox.html` ready for Chrome offscreen execution.

---

### 4. Unit Testing with Vitest / Jest

Create an isolated mock storage instance for each test suite:

```typescript
import { describe, it, expect } from 'vitest';
import { createBrowserMock, InMemoryStorageArea } from '@tuquet/extension-runner';

describe('Workflow Service Tests', () => {
  it('should isolate storage between tests', async () => {
    const mock = createBrowserMock({ sampleToken: 'secret_abc' });

    const res = await mock.storage.local.get('sampleToken');
    expect(res.sampleToken).toBe('secret_abc');
  });
});
```

---

## 📊 Comparison: `@tuquet/extension-runner` vs `webextension-polyfill`

| Evaluation Criteria                    | `webextension-polyfill` (Mozilla)                             | `@tuquet/extension-runner`                             |
| :------------------------------------- | :------------------------------------------------------------ | :----------------------------------------------------- |
| **Modern Chrome MV3 Support (v129+)**  | ❌ Prone to StorageArea crashes due to `this` context binding | ✅ 100% native `chrome.*` compatibility                |
| **Run Outside Extension (Web Studio)** | ❌ Throws `Cannot read properties of undefined`               | ✅ Automatically enables **Recursive Safe Proxy Mock** |
| **Crash-Proof Guarantee**              | ❌ Crashes when un-mocked APIs are called                     | ✅ Never crashes, always falls back safely             |
| **Runner Bundler Tool (Vite)**         | ❌ Not supported                                              | ✅ Built-in `tuquetRunnerPlugin` for Headless builds   |
| **Runtime Dependencies**               | Heavy external dependencies                                   | 🪶 **Zero runtime dependencies**                       |

---

## 🔧 API Reference

| Export Name                   | Type                | Description                                                                 |
| :---------------------------- | :------------------ | :-------------------------------------------------------------------------- |
| `default` / `browser`         | `any`               | Isomorphic browser API instance compatible with WebExtension specs.         |
| `isExtensionEnv()`            | `() => boolean`     | Returns `true` when running inside a real Chrome/Edge/Firefox extension.    |
| `isWebEnv()`                  | `() => boolean`     | Returns `true` when running in a standalone web browser, webview, or node.  |
| `createBrowserMock(initial?)` | `(data?) => any`    | Factory to instantiate an isolated mock runtime with recursive safe proxy.  |
| `InMemoryStorageArea`         | `class`             | Memory-backed storage implementation conforming to `browser.storage.local`. |
| `tuquetRunnerPlugin(options)` | `(opts?) => Plugin` | Vite build plugin for scaffolding and packaging headless extension runners. |

---

## 🌐 Ecosystem

Part of the **Automation & Agent Ecosystem**:

- [Automa](https://github.com/tuquet/automa) — Native Chrome/Edge Desktop UI Automation Browser.
- [Runner](https://github.com/tuquet/runner) — High-Performance Distributed Process Supervision Engine in Rust.
- [Browser](https://github.com/tuquet/browser) — High-Performance Headless Web Scraping & Stealth Automation Core.
- [Cloud](https://github.com/tuquet/cloud) — Enterprise Orchestration & Real-time Task Control Plane.
- [CLI](https://github.com/tuquet/cli) — Developer Ergonomic CLI & Unified Command Center.
- [Lib](https://github.com/tuquet/lib) — Monorepo for Shared Enterprise UI & Utilities (`vue-ui`, `vue-table`, `md-export`, `extension-runner`, `lunar`).
- [Scoop Bucket](https://github.com/tuquet/scoop-bucket) — Official Windows Scoop Distribution Channel.

---

## 📜 License

Distributed under the [MIT License](LICENSE).

---

<div align="center">
  <samp>
    <a href="https://tuquet.com">Portfolio</a> •
    <a href="https://tuquet.com/cv">CV &amp; Resume</a> •
    <a href="https://specter.specter.tuquet.com/automa/">Automa Studio</a> •
    <a href="https://storybook.tuquet.com/">Component Lab</a> •
    <a href="https://github.com/tuquet/scoop-bucket">Scoop Bucket</a>
  </samp>
</div>
