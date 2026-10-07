# @tuquet/crawl-interact

Autonomous DOM interactions: cookie/GDPR banner dismissal, progressive smooth scrolling, expanders, and DOM mutation quietness for web automation.

## Features

- **Multilingual Consent Dismissal**: Automatically detects and clicks GDPR/Cookie consent popups and close modals across English, Vietnamese, German, French, Spanish, and Italian.
- **Progressive Smooth Scroll**: Simulates natural human scrolling to trigger IntersectionObserver, lazy images, and dynamic pagination.
- **Expanders Detection**: Discovers and triggers collapsed "Read more" / "Xem thêm" elements.
- **DOM Quietness Detection**: Waits for AJAX hydration to settle.

## Installation

```bash
pnpm add @tuquet/crawl-interact
```

## Quick Start

```ts
import { dismissConsentModals, smoothScroll, waitForDomIdle } from '@tuquet/crawl-interact';

// 1. Dismiss annoying popups
dismissConsentModals();

// 2. Scroll to trigger lazy loading
await smoothScroll({ maxSteps: 10, stepPx: 400 });

// 3. Wait for DOM mutations to settle
await waitForDomIdle({ quietnessThresholdMs: 400 });
```

## License

MIT © Tuquet
