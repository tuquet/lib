# @tuquet/crawl-metadata

Zero-dependency universal metadata & Schema.org JSON-LD extractor for web scraping, SEO audit, and web automation pipelines.

## Features

- **Zero Runtime Dependencies**: Ultra-compact (< 3KB), works in modern browsers, Node.js, Bun, Cheerio, LinkeDOM, and happy-dom.
- **Full JSON-LD Schema.org Support**: Parses `@graph`, `Product`, `Article`, `NewsArticle`, `Recipe`, ratings, offers, and breadcrumbs safely.
- **Social Tags**: OpenGraph (`og:*`) & Twitter Cards (`twitter:*`).
- **Adaptive Fallback Hierarchy**: Automatically prioritizes high-confidence metadata fields (`og:title` -> `jsonLd.headline` -> `title`).

## Installation

```bash
pnpm add @tuquet/crawl-metadata
```

## Quick Start

```ts
import { extractMetadata } from '@tuquet/crawl-metadata';

// In browser or JSDOM environment
const meta = extractMetadata(document);

console.log(meta.title);
console.log(meta.product?.price);
console.log(meta.article?.author);
```

## License

MIT © Tuquet
