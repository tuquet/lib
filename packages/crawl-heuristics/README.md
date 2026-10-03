# @tuquet/crawl-heuristics

Zero-dependency DOM text-to-tag ratio density scoring and Reader-Mode content extractor for resilient web scraping without brittle CSS selectors.

## Features

- **Class-Agnostic Content Extraction**: Uses natural language sentence density, punctuation distribution, and link density analysis instead of rigid classes.
- **Noise Elimination**: Strips navbars, ads, headers, footers, comment threads, and social sharing widgets automatically.
- **Reading Metrics**: Calculates word count, excerpt, reading time, and confidence score.
- **Page Type Classifier**: Identifies `article`, `product`, `listing`, `homepage`, or `error` pages.

## Installation

```bash
pnpm add @tuquet/crawl-heuristics
```

## Quick Start

```ts
import { extractMainContent, detectPageType } from '@tuquet/crawl-heuristics';

// Discover primary article text from any page
const article = extractMainContent(document);
console.log(article.title);
console.log(article.text);
console.log(article.readingTimeMinutes);

// Classify page type
const type = detectPageType(document);
console.log(type); // 'article' | 'product' | 'listing' | 'error'
```

## License

MIT © Tuquet
