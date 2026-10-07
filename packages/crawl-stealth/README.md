# @tuquet/crawl-stealth

Zero-dependency anti-bot detection evasion scripts and fingerprint spoofing for CDP, Puppeteer, Playwright, and Tuquet Runner.

## Features

- **WebDriver Elimination**: Erases `navigator.webdriver = true` from both own properties and prototypes.
- **Chrome Runtime Emulation**: Mocks `window.chrome.runtime`, `csi`, `loadTimes`, and `app`.
- **WebGL Spoofing**: Overrides `UNMASKED_VENDOR_WEBGL` and `UNMASKED_RENDERER_WEBGL`.
- **Dual Mode**: Can be called directly in-page (`applyStealthInPage`) or injected via CDP (`getStealthInjectionScript`).

## Installation

```bash
pnpm add @tuquet/crawl-stealth
```

## Quick Start

```ts
import { applyStealthInPage, getStealthInjectionScript } from '@tuquet/crawl-stealth';

// 1. Injected via CDP Page.addScriptToEvaluateOnNewDocument:
const script = getStealthInjectionScript({
  webglVendor: 'Intel Inc.',
  languages: ['en-US', 'en'],
});

// 2. Or executed directly inside tab context:
applyStealthInPage();
```

## License

MIT © Tuquet
