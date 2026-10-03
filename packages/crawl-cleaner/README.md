# @tuquet/crawl-cleaner

Zero-dependency DOM sanitizer and HTML-to-Markdown token reducer for LLM web scraping pipelines.

## Features

- **Boilerplate Stripper**: Eliminates `<script>`, `<style>`, `<iframe>`, `<svg>`, ad containers, trackers, and redundant inline styling.
- **Semantic Markdown**: Converts clean DOM elements directly into clean Markdown headings, codeblocks, tables, lists, images, and links.
- **Token Compression**: Compresses raw HTML by up to 90% before prompting Large Language Models (LLMs), saving costs and latency.
- **Link Normalizer**: Automatically resolves relative `href` and `src` into absolute URLs.

## Installation

```bash
pnpm add @tuquet/crawl-cleaner
```

## Quick Start

```ts
import { domToMarkdown, estimateTokenSavings } from '@tuquet/crawl-cleaner';

const markdown = domToMarkdown(document.body, {
  baseUrl: 'https://example.com',
  includeImages: true,
  includeLinks: true,
});

console.log(markdown);
```

## License

MIT © Tuquet
