// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  extractArticleFromJsonLd,
  extractJsonLd,
  extractMetadata,
  extractOpenGraph,
  extractProductFromJsonLd,
} from '../src/index.js';

describe('@tuquet/crawl-metadata', () => {
  it('extracts OpenGraph tags accurately', () => {
    document.head.innerHTML = `
      <meta property="og:title" content="Tuquet Next-Gen Automation" />
      <meta property="og:description" content="Distributed process supervision engine" />
      <meta property="og:image" content="https://tuquet.io/cover.png" />
      <meta property="og:url" content="https://tuquet.io" />
      <meta property="og:site_name" content="Tuquet" />
    `;

    const og = extractOpenGraph(document);
    expect(og.title).toBe('Tuquet Next-Gen Automation');
    expect(og.description).toBe('Distributed process supervision engine');
    expect(og.image).toBe('https://tuquet.io/cover.png');
    expect(og.url).toBe('https://tuquet.io');
    expect(og.site_name).toBe('Tuquet');
  });

  it('extracts and parses JSON-LD Product schema', () => {
    document.body.innerHTML = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Smart Connected EV",
        "image": "https://vinfastauto.com/car.png",
        "sku": "EV-VF8",
        "brand": {
          "@type": "Brand",
          "name": "VinFast"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": "46000",
          "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "1250"
        }
      }
      </script>
    `;

    const jsonLd = extractJsonLd(document);
    expect(jsonLd.length).toBe(1);

    const product = extractProductFromJsonLd(jsonLd);
    expect(product).toBeDefined();
    expect(product?.name).toBe('Smart Connected EV');
    expect(product?.brand).toBe('VinFast');
    expect(product?.price).toBe('46000');
    expect(product?.currency).toBe('USD');
    expect(product?.ratingValue).toBe(4.8);
    expect(product?.reviewCount).toBe(1250);
  });

  it('extracts and parses JSON-LD Article with @graph', () => {
    document.body.innerHTML = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": "Tuquet Blog"
          },
          {
            "@type": "NewsArticle",
            "headline": "Zero-Zombie Process Supervision in Rust",
            "datePublished": "2026-10-01T08:00:00Z",
            "author": {
              "@type": "Person",
              "name": "Tu Quet"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Tuquet Ecosystem"
            },
            "keywords": "rust, chromium, process supervision"
          }
        ]
      }
      </script>
    `;

    const jsonLd = extractJsonLd(document);
    expect(jsonLd.length).toBe(2);

    const article = extractArticleFromJsonLd(jsonLd);
    expect(article).toBeDefined();
    expect(article?.headline).toBe('Zero-Zombie Process Supervision in Rust');
    expect(article?.author).toBe('Tu Quet');
    expect(article?.datePublished).toBe('2026-10-01T08:00:00Z');
    expect(article?.tags).toContain('rust');
  });

  it('resolves universal fallback hierarchy across sources', () => {
    document.head.innerHTML = `
      <title>HTML Standard Title</title>
      <meta name="description" content="HTML meta description" />
      <meta property="og:title" content="OpenGraph Preferred Title" />
      <link rel="canonical" href="https://example.com/canonical-url" />
    `;
    document.body.innerHTML = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Schema Headline",
        "author": { "name": "Lead Architect" }
      }
      </script>
    `;

    const metadata = extractMetadata(document);
    // og:title takes priority over HTML standard title
    expect(metadata.title).toBe('OpenGraph Preferred Title');
    expect(metadata.canonical).toBe('https://example.com/canonical-url');
    expect(metadata.author).toBe('Lead Architect');
    expect(metadata.description).toBe('HTML meta description');
  });
});
