# @tuquet/crawler

Universal Web Crawling & Semantic Data Extraction Pipeline assembling metadata parsing, interaction automation, text-density heuristics, and token-efficient markdown generation.

## Architectural Components

This package is composed of 5 standalone atomic micro-packages:

- `@tuquet/crawl-metadata`: Schema.org JSON-LD & OpenGraph extractor.
- `@tuquet/crawl-interact`: Autonomous GDPR/Cookie modal dismisser & smooth scroller.
- `@tuquet/crawl-heuristics`: Text-to-Tag ratio scoring & Reader Mode extractor.
- `@tuquet/crawl-cleaner`: DOM sanitizer & Markdown converter for LLM tokens.
- `@tuquet/crawl-stealth`: Anti-bot fingerprint spoofing & CDP injection script.

## Installation

```bash
pnpm add @tuquet/crawler
```

## Quick Start

```ts
import { crawlDocument } from '@tuquet/crawler';

// Run full pipeline in browser or JSDOM:
const result = await crawlDocument(document, {
  autoDismissModals: true,
  autoScroll: true,
  toMarkdown: true,
});

console.log(result.metadata.title);
console.log(result.article.text);
console.log(result.markdown);
```

## License

MIT © Tuquet
