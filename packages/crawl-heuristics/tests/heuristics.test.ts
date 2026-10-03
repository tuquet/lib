// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { detectPageType, extractMainContent, getLinkDensity, scoreNode } from '../src/index.js';

describe('@tuquet/crawl-heuristics', () => {
  it('correctly calculates link density', () => {
    document.body.innerHTML = `
      <div id="nav">
        <a href="/home">Home</a>
        <a href="/about">About Us</a>
        <a href="/contact">Contact</a>
      </div>
      <div id="article">
        <p>This is a long informative article paragraph with extensive discussion and natural sentences. There is only <a href="#">one single link</a> in this entire paragraph.</p>
      </div>
    `;

    const nav = document.getElementById('nav')!;
    const article = document.getElementById('article')!;

    expect(getLinkDensity(nav)).toBeGreaterThan(0.7);
    expect(getLinkDensity(article)).toBeLessThan(0.3);
  });

  it('assigns high content scores to article bodies and penalizes navbars', () => {
    document.body.innerHTML = `
      <nav id="site-nav">
        <a href="/">Home</a>
        <a href="/news">News</a>
      </nav>
      <article class="post-content">
        <h1>Understanding Process Isolation in Modern Operating Systems</h1>
        <p>Processes in modern operating systems are isolated using kernel sandboxes, namespaces, and control groups. This architecture guarantees that rogue processes cannot monopolize system memory.</p>
        <p>Furthermore, supervisor daemons utilize completion ports and job objects on Windows, or process groups on POSIX, to perform synchronous cleanup upon task completion.</p>
      </article>
    `;

    const nav = document.getElementById('site-nav')!;
    const article = document.querySelector('.post-content')!;

    const navScore = scoreNode(nav);
    const articleScore = scoreNode(article);

    expect(navScore.contentScore).toBe(0);
    expect(articleScore.contentScore).toBeGreaterThan(30);
  });

  it('extracts main content, word count, and reading time', () => {
    document.body.innerHTML = `
      <header>
        <div class="logo">Tech Times</div>
        <nav><a href="/">Home</a></nav>
      </header>
      <main>
        <article>
          <h1>Next-Generation Web Scraping Architecture</h1>
          <div class="byline">By Tu Quet</div>
          <p>Modern web scraping architecture demands resilient multi-tiered extraction pipelines. Rather than depending on rigid CSS selectors, engineering teams deploy heuristic text-to-tag ratio analysis alongside Schema.org metadata inspection.</p>
          <p>By decoupling navigation from semantic parsing, scraping systems achieve exceptional durability against layout revamps, front-end refactorings, and obfuscated CSS module classnames.</p>
        </article>
      </main>
      <footer>
        <p>© 2026 Tech Times. All rights reserved.</p>
      </footer>
    `;

    const result = extractMainContent(document);
    expect(result.title).toBe('Next-Generation Web Scraping Architecture');
    expect(result.byline).toBe('By Tu Quet');
    expect(result.wordCount).toBeGreaterThan(40);
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(result.text).toContain('Modern web scraping architecture');
    expect(result.text).not.toContain('All rights reserved');
  });

  it('detects page types accurately', () => {
    // 404 page
    document.title = '404 - Page Not Found';
    document.body.innerHTML = '<h1>404 Not Found</h1>';
    expect(detectPageType(document)).toBe('error');

    // Product page
    document.title = 'Ergonomic Mechanical Keyboard';
    document.body.innerHTML = `
      <h1 class="title">Ergonomic Mechanical Keyboard</h1>
      <span class="price">$199.00</span>
      <button class="add-to-cart">Add to Cart</button>
    `;
    expect(detectPageType(document)).toBe('product');
  });
});
