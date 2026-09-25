# @tuquet/extension-runner

> **Isomorphic WebExtension Polyfill, Crash-Proof Mock, and Headless Extension Runner Bundler.**

Part of the **Tuquet Ecosystem** for resilient web automation and browser orchestration.

---

## ⚡ Features

- **Isomorphic Browser Polyfill**: Automatically provides native `browser` (Firefox) or `chrome` (Chrome MV3) when running inside an extension.
- **Crash-Proof Mock Runtime**: In Web Studio, Storybook, Node.js, and test environments, provides a safe Recursive Proxy that **never throws** `Cannot read properties of undefined (reading 'runtime')` or `browser.storage.local is not a function`.
- **In-Memory & LocalStorage State**: Full implementation of `browser.storage.local` (`get`, `set`, `remove`, `clear`, `onChanged`).
- **Headless Runner Bundler Plugin**: Vite plugin that strips UI elements from Manifest V3 and generates offscreen and sandbox documents for headless automation workers.

---

## 📦 Installation

```bash
pnpm add @tuquet/extension-runner
```

---

## 🚀 Usage

### 1. Isomorphic Browser API

```typescript
import browser, { isExtensionEnv, isWebEnv } from '@tuquet/extension-runner';

// Safely access extension storage in both Extension and Web Studio
await browser.storage.local.set({ token: 'xyz' });
const { token } = await browser.storage.local.get('token');

// Even unmocked APIs won't crash your web app!
await browser.cookies.getAll({}); // Resolves safely
```

### 2. Vite Plugin for Headless Runner

```typescript
// vite.runner.config.ts
import { defineConfig } from 'vite';
import { tuquetRunnerPlugin } from '@tuquet/extension-runner';

export default defineConfig({
  plugins: [
    tuquetRunnerPlugin({
      manifestPath: './src/manifest.chrome.json',
      name: 'My Headless Runner',
    }),
  ],
});
```

---

## 📜 License

MIT © [Tuquet Team](https://github.com/tuquet)
